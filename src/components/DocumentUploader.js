"use client";
import { useState } from "react";
import { uploadDocuments, updateAgentType } from "@/utils/api";

export default function DocumentUploader({
  sessionId,
  agentType,
  recommendations,
  onNext,
  onBack,
  isLoading,
  setIsLoading,
}) {
  const [documents, setDocuments] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const addDocument = (name, content) => {
    setDocuments((prev) => [...prev, { name, content }]);
  };

  const removeDocument = (index) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (files) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        addDocument(file.name, e.target.result);
      };
      reader.readAsText(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (documents.length === 0) {
      alert("Please add at least one document");
      return;
    }

    setIsLoading(true);
    try {
      await updateAgentType(sessionId, agentType);
      await uploadDocuments(sessionId, documents);
      onNext(documents);
    } catch (error) {
      console.error("Error uploading documents:", error);
      alert("Error uploading documents. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Upload Documents for your {agentType} Agent
        </h2>
        <p className="text-gray-600">Add the knowledge your agent needs</p>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          📋 Recommended Documents:
        </h3>
        <div className="text-gray-800 whitespace-pre-wrap">
          {recommendations}
        </div>
      </div>

      {/* File Upload */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="text-4xl mb-4">📁</div>
        <p className="text-lg font-medium text-gray-700 mb-2">
          Drop files here or click to upload
        </p>
        <p className="text-gray-500 mb-4">Supports: .txt, .pdf, .doc, .csv</p>
        <input
          type="file"
          multiple
          accept=".txt,.pdf,.doc,.docx,.csv"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
        >
          Choose Files
        </label>
      </div>

      {/* Manual Text Input */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Or Add Text Manually:
        </h3>
        <ManualTextInput onAdd={addDocument} />
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Added Documents ({documents.length}):
          </h3>
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-blue-300/20 p-4 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{doc.name}</h4>
                  <p className="text-sm text-gray-600">
                    {doc.content.length} characters
                  </p>
                </div>
                <button
                  onClick={() => removeDocument(index)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={documents.length === 0 || isLoading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing...</span>
            </div>
          ) : (
            "Start Voice Chat →"
          )}
        </button>
      </div>
    </div>
  );
}

// Manual text input component
function ManualTextInput({ onAdd }) {
  const [name, setName] = useState("all docs");
  const [content, setContent] = useState(`
    
    RECEPTIONIST AGENT KNOWLEDGE BASE - TechSolutions Inc.

===========================================
1. EMPLOYEE DIRECTORY
===========================================

Name,Department,Title,Extension,Email,Direct Phone
John Smith,Sales,Sales Manager,101,john.smith@techsolutions.com,555-0101
Sarah Johnson,Marketing,Marketing Director,102,sarah.johnson@techsolutions.com,555-0102
Mike Davis,IT,IT Support Specialist,103,mike.davis@techsolutions.com,555-0103
Lisa Chen,HR,HR Manager,104,lisa.chen@techsolutions.com,555-0104
Robert Brown,Finance,Finance Director,105,robert.brown@techsolutions.com,555-0105
Amanda Wilson,Sales,Sales Representative,106,amanda.wilson@techsolutions.com,555-0106
David Garcia,Operations,Operations Manager,107,david.garcia@techsolutions.com,555-0107
Jennifer Lee,Customer Service,Customer Service Lead,108,jennifer.lee@techsolutions.com,555-0108
Tom Anderson,IT,Senior Developer,109,tom.anderson@techsolutions.com,555-0109
Emily Rodriguez,Marketing,Marketing Coordinator,110,emily.rodriguez@techsolutions.com,555-0110
Michael Chang,Sales,Account Executive,111,michael.chang@techsolutions.com,555-0111
Rachel Green,HR,HR Assistant,112,rachel.green@techsolutions.com,555-0112
Steve Wilson,IT,Network Administrator,113,steve.wilson@techsolutions.com,555-0113
Karen White,Finance,Accountant,114,karen.white@techsolutions.com,555-0114
James Miller,Operations,Operations Assistant,115,james.miller@techsolutions.com,555-0115

===========================================
2. COMPANY DIRECTORY/ORGANIZATIONAL CHART
===========================================

TECHSOLUTIONS INC. ORGANIZATIONAL STRUCTURE

CEO: Richard Thompson (Ext. 100, richard.thompson@techsolutions.com)

DEPARTMENTS AND REPORTING STRUCTURE:

SALES DEPARTMENT (Manager: John Smith, Ext. 101)
├── Amanda Wilson - Sales Representative (Ext. 106)
├── Michael Chang - Account Executive (Ext. 111)
└── Handles: New client inquiries, product demos, quotes, pricing

MARKETING DEPARTMENT (Director: Sarah Johnson, Ext. 102)
├── Emily Rodriguez - Marketing Coordinator (Ext. 110)
└── Handles: Brand inquiries, events, partnerships, media requests

IT DEPARTMENT (Manager: Mike Davis, Ext. 103)
├── Tom Anderson - Senior Developer (Ext. 109)
├── Steve Wilson - Network Administrator (Ext. 113)
└── Handles: Technical support, system issues, software problems

HUMAN RESOURCES (Manager: Lisa Chen, Ext. 104)
├── Rachel Green - HR Assistant (Ext. 112)
└── Handles: Employment inquiries, benefits, payroll, employee relations

FINANCE DEPARTMENT (Director: Robert Brown, Ext. 105)
├── Karen White - Accountant (Ext. 114)
└── Handles: Billing inquiries, payments, invoices, financial matters

OPERATIONS (Manager: David Garcia, Ext. 107)
├── James Miller - Operations Assistant (Ext. 115)
└── Handles: Facility management, supplies, logistics, general operations

CUSTOMER SERVICE (Lead: Jennifer Lee, Ext. 108)
└── Handles: General inquiries, complaints, appointment scheduling, support

===========================================
3. FREQUENTLY ASKED QUESTIONS (FAQ)
===========================================

BUSINESS HOURS & LOCATION:
Q: What are your business hours?
A: Monday-Friday 9:00 AM to 6:00 PM, Saturday 10:00 AM to 4:00 PM. Closed Sundays and major holidays.

Q: Where are you located?
A: 123 Business Park Drive, Suite 200, Tech City, TC 12345. We're in the Tech Business Park, Building C, Second Floor.

Q: Is parking available?
A: Yes, free parking is available in the visitor spaces in front of Building C. Visitor passes are available at the front desk.

SERVICES & PRODUCTS:
Q: What services do you offer?
A: We provide IT consulting, custom software development, network setup and maintenance, cybersecurity solutions, cloud migration, and 24/7 technical support.

Q: Do you work with small businesses?
A: Yes, we work with businesses of all sizes, from startups to enterprise companies.

Q: Can you provide a quote?
A: Yes, we offer free consultations and quotes. I can connect you with our Sales team at extension 101.

APPOINTMENTS & SCHEDULING:
Q: Do I need an appointment?
A: Yes, all consultations and meetings require appointments. We can schedule same-day appointments based on availability.

Q: How do I schedule an appointment?
A: I can help you schedule an appointment right now, or you can contact our Customer Service team at extension 108.

Q: Can I reschedule my appointment?
A: Yes, we require 24-hour notice for rescheduling. Less than 24 hours may incur fees.

SUPPORT & EMERGENCIES:
Q: Do you offer emergency support?
A: Yes, we provide 24/7 emergency support for existing clients. Emergency rates apply after business hours.

Q: How do I report a system outage?
A: For emergencies, contact our IT department immediately at extension 103, or call our emergency line at 555-0200.

BILLING & PAYMENTS:
Q: What payment methods do you accept?
A: We accept credit cards (Visa, MasterCard, AmEx), ACH transfers, checks, and offer Net 30 terms for approved business clients.

Q: Who handles billing questions?
A: Our Finance department handles all billing inquiries. You can reach them at extension 105.

===========================================
4. COMPANY POLICIES & PROCEDURES
===========================================

VISITOR POLICIES:
- All visitors must check in at the front desk and receive a visitor badge
- Visitors must be accompanied by an employee at all times
- Valid ID required for all visitors
- Visitor parking is available in designated spaces only
- Maximum visit duration is 4 hours without prior approval

DELIVERY PROCEDURES:
- Deliveries accepted Monday-Friday 9:00 AM to 5:00 PM
- Large deliveries require 24-hour advance notice
- All packages must be signed for by authorized personnel
- Delivery entrance is at the rear loading dock
- Contact Operations at Ext. 107 for delivery coordination

PHONE ETIQUETTE:
- Answer within 3 rings with standard greeting
- Always ask "How may I direct your call?" after greeting
- Put callers on hold for no more than 30 seconds without checking back
- Take detailed messages including: name, company, phone number, reason for call, best time to return call
- Confirm spelling of names and repeat phone numbers back

SECURITY PROCEDURES:
- Never give out personal information about employees
- Do not confirm whether someone works here unless they're calling from a verified business number
- Report suspicious visitors or calls to Security immediately
- After hours, all calls go to the answering service
- Emergency contacts must go through proper verification

CONFIDENTIALITY:
- Do not discuss client information with unauthorized parties
- Salary and personal employee information is strictly confidential
- Project details should not be shared with outside parties
- When in doubt, refer callers to the appropriate department head

===========================================
5. KEY PERSONNEL CONTACT INFORMATION
===========================================

EMERGENCY CONTACTS:
- CEO: Richard Thompson - Cell: 555-0001 (Emergency only)
- Operations Manager: David Garcia - Cell: 555-0007 (After hours)
- IT Emergency Line: 555-0200 (24/7 technical emergencies)
- Building Security: 555-0300 (Security issues)

DEPARTMENT HEADS (Direct Lines):
- Sales Manager (John Smith): 555-0101
- Marketing Director (Sarah Johnson): 555-0102  
- IT Manager (Mike Davis): 555-0103
- HR Manager (Lisa Chen): 555-0104
- Finance Director (Robert Brown): 555-0105
- Operations Manager (David Garcia): 555-0107
- Customer Service Lead (Jennifer Lee): 555-0108

SPECIAL CONTACTS:
- Facilities Management: Ext. 107 (David Garcia)
- New Employee Orientation: Ext. 104 (Lisa Chen)
- Client Complaints: Ext. 108 (Jennifer Lee)
- Media Inquiries: Ext. 102 (Sarah Johnson)
- Technical Emergencies: Ext. 103 (Mike Davis) or 555-0200
- Vendor/Supplier Issues: Ext. 107 (David Garcia)

EXTERNAL CONTACTS:
- Building Management: 555-0350
- Cleaning Service: 555-0360
- IT Vendor Support: 1-800-TECH-HELP
- Office Supply Company: 555-0370

===========================================
6. SCRIPTED GREETINGS & CALL TRANSFER PHRASES
===========================================

STANDARD GREETING:
"Good [morning/afternoon], TechSolutions Incorporated, this is [Your Name] speaking. How may I direct your call?"

ALTERNATIVE GREETINGS:
"Thank you for calling TechSolutions, this is [Your Name]. How may I assist you today?"
"TechSolutions, [Your Name] speaking. How can I help you?"

TRANSFER PHRASES:
"I'd be happy to connect you with [Department/Person]. Please hold while I transfer your call."
"Let me transfer you to [Name] in our [Department] department. They'll be able to assist you with that."
"I'm going to put you through to [Name] who specializes in [area]. One moment please."

HOLD PHRASES:
"May I place you on a brief hold while I locate that information?"
"Can you hold for just a moment while I check on that for you?"
"Please hold while I see if [Name] is available."

WHEN SOMEONE IS UNAVAILABLE:
"I'm sorry, [Name] is not available at the moment. Would you like to leave a voicemail or may I take a message?"
"[Name] is currently with another client. Can I have them return your call, or would you prefer to leave a voicemail?"
"[Name] is away from their desk. I can take a detailed message and have them call you back within the hour."

TAKING MESSAGES:
"I'd be happy to take a message for you. May I have your name and phone number?"
"Let me get your contact information so [Name] can return your call promptly."
"I'll make sure [Name] gets this message. Could you spell your last name for me?"

ENDING CALLS:
"Is there anything else I can help you with today?"
"Thank you for calling TechSolutions. Have a great day!"
"Thank you for calling. We appreciate your business!"

COMMON SITUATIONS:
Wrong Number: "I'm sorry, there's no one here by that name. You may have reached us in error. What number were you trying to reach?"

Complaint: "I understand your concern. Let me connect you with our Customer Service department who can best assist you with this matter."

Sales Inquiry: "That sounds like something our Sales team can help you with. Let me transfer you to our Sales Manager, John Smith."

Technical Issue: "For technical support, I'll connect you with our IT department. They're available to help you right away."

General Information: "I can help you with that information. [Provide answer] Is there anything else you'd like to know?"

===========================================
COMPANY QUICK REFERENCE
===========================================

Main Number: (555) 123-TECH
Address: 123 Business Park Drive, Suite 200, Tech City, TC 12345
Hours: Monday-Friday 9:00 AM to 6:00 PM, Saturday 10:00 AM to 4:00 PM
Emergency IT Support: 555-0200 (24/7)
General Email: info@techsolutions.com
Website: www.techsolutions.com

This knowledge base contains all the information needed for professional receptionist duties including call routing, information provision, and following company protocols.
    
    `);

  const handleAdd = () => {
    if (name.trim() && content.trim()) {
      onAdd(name, content);
      setName("");
      setContent("");
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Document name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
      />
      <textarea
        placeholder="Paste your document content here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows="6"
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
      />
      <button
        onClick={handleAdd}
        disabled={!name.trim() || !content.trim()}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Add Document
      </button>
    </div>
  );
}
