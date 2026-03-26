# OFFER WORKFLOW - MERMAID DIAGRAMS

---

## 1. WORKFLOW OVERVIEW (Flowchart)

```mermaid
flowchart TD
    Start([Start]) --> Create[HR creates Offer<br/>DRAFT]
    Create --> Edit{Need to edit?}
    Edit -->|Yes| Update[HR updates<br/>Salary, Benefits, StartDate]
    Update --> Edit
    Edit -->|No| Submit[HR Submits<br/>IN_REVIEW]
    
    Submit --> DirectorReview{Director<br/>reviews}
    DirectorReview -->|Reject| Rejected[REJECTED<br/>End]
    DirectorReview -->|Approve| Approved[APPROVED]
    
    Approved --> Send[HR sends to Candidate<br/>SENT]
    Send --> CandidateResponse{Candidate<br/>responds}
    
    CandidateResponse -->|Accept| Accepted[ACCEPTED<br/>Success]
    CandidateResponse -->|Decline| Declined[DECLINED<br/>End]
    CandidateResponse -->|Negotiate| Negotiating[NEGOTIATING]
    
    Negotiating --> NegotiateDecision{HR decides}
    NegotiateDecision -->|Minor changes| UpdateOffer[HR updates Offer<br/>Save Edit History]
    UpdateOffer --> ResendDirect[Resend to Candidate<br/>SENT]
    ResendDirect --> CandidateResponse
    
    NegotiateDecision -->|Major changes| SubmitManager[HR Staff sends<br/>PENDING_HR_MANAGER]
    SubmitManager --> ManagerReview[HR Manager reviews]
    ManagerReview --> ForwardDirector[Forward to Director<br/>IN_REVIEW]
    ForwardDirector --> DirectorReview
    
    Accepted --> StaffSend{HR Staff<br/>send to Manager?}
    StaffSend -->|Yes| SendToManager[Send list<br/>to HR Manager]
    StaffSend -->|No| WaitMore[Wait for more<br/>accepted offers]
    SendToManager --> ManagerReceive[HR Manager<br/>receives list]
    ManagerReceive --> Success([Complete])
    
    Rejected --> End1([End])
    De