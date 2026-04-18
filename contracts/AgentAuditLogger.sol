// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title AgentAuditLogger
 * @dev Protocol for transparent logging, explainability, and verification of decisions made by autonomous agents.
 */
contract AgentAuditLogger {
    
    // Status of a logged decision
    // 0: Pending/Active, 1: Challenged, 2: Resolved
    enum Status { Pending, Challenged, Resolved }

    struct Decision {
        uint256 id;
        string action;
        string reason;
        uint256 amount;
        string explanationHash;
        uint256 timestamp;
        address agent;
        string agentName;
        uint8 status; // Uses uint8 to map to the enum (0, 1, 2)
        bool disputed;
    }

    uint256 public totalDecisions;
    mapping(uint256 => Decision) private decisions;
    mapping(string => int256) public agentReputations;

    // Address that has the right to resolve disputes (can be a multisig, a DAO, or an admin)
    address public governanceRole;

    event DecisionLogged(uint256 indexed id, string action, address agent);
    event DecisionChallenged(uint256 indexed id, address challenger);
    event DisputeResolved(uint256 indexed id, bool upheld);

    /**
     * @dev Sets the deployer as the initial governance/DAO role.
     */
    constructor() {
        governanceRole = msg.sender;
    }

    modifier onlyGovernance() {
        require(msg.sender == governanceRole, "AgentAuditLogger: caller is not the governance role");
        _;
    }

    /**
     * @dev Allows updating the governance role (e.g., transferring control to a DAO).
     * @param _newGovernance The address of the new governance contract/wallet.
     */
    function transferGovernance(address _newGovernance) public onlyGovernance {
        require(_newGovernance != address(0), "AgentAuditLogger: new governance is the zero address");
        governanceRole = _newGovernance;
    }

    /**
     * @dev Log a decision made by an autonomous agent.
     * @param _action The action taken.
     * @param _reason Human-readable explanation for the decision.
     * @param _amount Any numeric value or token amount associated with the decision.
     * @return id The unique ID of the logged decision.
     */
    function logDecision(string memory _agentName, string memory _action, string memory _reason, uint256 _amount, string memory _explanationHash) public returns (uint256) {
        uint256 id = totalDecisions;
        
        decisions[id] = Decision({
            id: id,
            action: _action,
            reason: _reason,
            amount: _amount,
            explanationHash: _explanationHash,
            timestamp: block.timestamp,
            agent: msg.sender,
            agentName: _agentName,
            status: uint8(Status.Pending),
            disputed: false
        });

        // Initialize reputation if never used (let's check if it's strictly 0 as default, we can just treat baseline as 100 on frontend or natively here)
        // Default mapping value is 0, so if we want them to start at 100, we add offset on frontend or add here:
        if (agentReputations[_agentName] == 0) {
            agentReputations[_agentName] = 100;
        }

        totalDecisions++;

        emit DecisionLogged(id, _action, msg.sender);
        return id;
    }

    /**
     * @dev Allows any user or governing body to challenge an agent's decision.
     * @param _id The ID of the decision to challenge.
     */
    function challengeDecision(uint256 _id) public onlyGovernance {
        require(_id < totalDecisions, "AgentAuditLogger: Decision does not exist");
        Decision storage decision = decisions[_id];
        
        require(decision.status == uint8(Status.Pending), "AgentAuditLogger: Decision not in correct state to be challenged");

        decision.status = uint8(Status.Challenged);
        decision.disputed = true;

        emit DecisionChallenged(_id, msg.sender);
    }

    /**
     * @dev Resolves a challenged decision. Only callable by the governance role.
     * @param _id The ID of the decision.
     * @param _upheld True if the challenge was upheld (agent was wrong/overridden), false if rejected (agent was right).
     */
    function resolveDispute(uint256 _id, bool _upheld) public onlyGovernance {
        require(_id < totalDecisions, "AgentAuditLogger: Decision does not exist");
        Decision storage decision = decisions[_id];
        
        require(decision.status == uint8(Status.Challenged), "AgentAuditLogger: Decision must be challenged to be resolved");

        decision.status = uint8(Status.Resolved);
        
        if (_upheld) {
            // Malicious Agent: -50 penalty
            agentReputations[decision.agentName] -= 50;
        } else {
            // Defended accurately: +10 reward
            agentReputations[decision.agentName] += 10;
        }

        emit DisputeResolved(_id, _upheld);
    }

    /**
     * @dev Retrieves the full details of a decision.
     * @param _id The ID of the decision.
     * @return The Decision struct containing all properties.
     */
    function getDecision(uint256 _id) public view returns (Decision memory) {
        require(_id < totalDecisions, "AgentAuditLogger: Decision does not exist");
        return decisions[_id];
    }

    /**
     * @dev Gets the reputation score of a specific agent persona.
     */
    function getReputation(string memory _agentName) public view returns (int256) {
        int256 rep = agentReputations[_agentName];
        return rep == 0 ? int256(100) : rep; // Display 100 if completely fresh
    }
}
