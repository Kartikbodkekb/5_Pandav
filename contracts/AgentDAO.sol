// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./AgentAuditLogger.sol";

/**
 * @title AgentDAO
 * @dev A simple DAO designed to govern the AgentAuditLogger protocol. 
 * Allows DAO members to vote on challenged agent decisions and resolve them transparently.
 */
contract AgentDAO {
    
    AgentAuditLogger public auditLogger;
    
    // Who can vote in this DAO?
    mapping(address => bool) public isMember;
    uint256 public totalMembers;

    struct DisputeProposal {
        uint256 decisionId;
        uint256 votesUpheld; // Votes that the agent was WRONG (Challenge Upheld)
        uint256 votesRejected; // Votes that the agent was RIGHT (Challenge Rejected)
        uint256 endTime;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    // Mapping from proposalId to Proposal (here proposalId maps 1:1 with decisionId for simplicity)
    mapping(uint256 => DisputeProposal) public disputeProposals;

    event MemberAdded(address member);
    event MemberRemoved(address member);
    event VoteCast(uint256 indexed decisionId, address voter, bool supportUpheld);
    event DisputeExecution(uint256 indexed decisionId, bool upheld);

    /**
     * @dev Initialize DAO with the logger and add deployer as first member
     * @param _loggerAddress Address of deployed AgentAuditLogger
     */
    constructor(address _loggerAddress) {
        require(_loggerAddress != address(0), "AgentDAO: invalid logger address");
        auditLogger = AgentAuditLogger(_loggerAddress);
        
        isMember[msg.sender] = true;
        totalMembers = 1;
        emit MemberAdded(msg.sender);
    }

    modifier onlyMember() {
        require(isMember[msg.sender], "AgentDAO: caller is not a DAO member");
        _;
    }

    // --- Membership Management ---
    
    function addMember(address _newMember) external onlyMember {
        require(!isMember[_newMember], "AgentDAO: already a member");
        isMember[_newMember] = true;
        totalMembers++;
        emit MemberAdded(_newMember);
    }

    function removeMember(address _member) external onlyMember {
        require(isMember[_member], "AgentDAO: not a member");
        require(totalMembers > 1, "AgentDAO: cannot remove the last member");
        isMember[_member] = false;
        totalMembers--;
        emit MemberRemoved(_member);
    }

    // --- Governance Over Decisions ---

    /**
     * @dev Allows a DAO member to directly challenge a decision and immediately start the voting process.
     */
    function challengeAndInitiateVote(uint256 _decisionId) external onlyMember {
        require(disputeProposals[_decisionId].endTime == 0, "AgentDAO: Vote already initiated for this decision");
        
        auditLogger.challengeDecision(_decisionId);
        
        DisputeProposal storage proposal = disputeProposals[_decisionId];
        proposal.decisionId = _decisionId;
        proposal.endTime = block.timestamp + 3 days; // 3 days voting period
    }

    /**
     * @dev Start a vote to resolve a challenged decision.
     * Starts a 3-day voting window.
     */
    function initiateDisputeVote(uint256 _decisionId) external onlyMember {
        AgentAuditLogger.Decision memory decision = auditLogger.getDecision(_decisionId);
        require(decision.status == 1, "AgentDAO: Decision is not explicitly challenged");
        require(disputeProposals[_decisionId].endTime == 0, "AgentDAO: Vote already initiated for this decision");

        DisputeProposal storage proposal = disputeProposals[_decisionId];
        proposal.decisionId = _decisionId;
        proposal.endTime = block.timestamp + 3 days; // 3 days voting period
    }

    /**
     * @dev DAO members cast their vote.
     * @param _decisionId The decision ID being voted on.
     * @param _voteUpheld True means "I agree with the Challenger. Agent is wrong."
     *                    False means "I disagree with Challenger. Agent is right."
     */
    function castVote(uint256 _decisionId, bool _voteUpheld) external onlyMember {
        DisputeProposal storage proposal = disputeProposals[_decisionId];
        require(proposal.endTime > 0, "AgentDAO: Vote not initiated");
        require(block.timestamp < proposal.endTime, "AgentDAO: Voting period has ended");
        require(!proposal.hasVoted[msg.sender], "AgentDAO: Member has already voted");

        proposal.hasVoted[msg.sender] = true;

        if (_voteUpheld) {
            proposal.votesUpheld++;
        } else {
            proposal.votesRejected++;
        }

        emit VoteCast(_decisionId, msg.sender, _voteUpheld);
    }

    /**
     * @dev Execute the result of the vote and call resolveDispute on the Logger.
     * Can be called by anyone once the voting period has ended.
     */
    function executeResolution(uint256 _decisionId) external {
        DisputeProposal storage proposal = disputeProposals[_decisionId];
        require(proposal.endTime > 0, "AgentDAO: Vote not initiated");
        require(block.timestamp >= proposal.endTime, "AgentDAO: Voting period has not ended yet");
        require(!proposal.executed, "AgentDAO: Resolution already executed");

        proposal.executed = true;

        bool isUpheld = proposal.votesUpheld > proposal.votesRejected;

        // Call the underlying protocol to record the resolution tracking transparently
        auditLogger.resolveDispute(_decisionId, isUpheld);

        emit DisputeExecution(_decisionId, isUpheld);
    }
}
