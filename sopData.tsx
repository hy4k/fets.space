
import React from 'react';
import { SOPSection } from './types';

const ArrowDown = () => (
  <div className="flex justify-center my-2">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  </div>
);

const FlowBox = ({ text, type = 'action' }: { text: string, type?: 'start' | 'action' | 'decision' }) => {
  let bgColor = 'bg-[#1a1a1a] border-gray-600';
  let textColor = 'text-gray-200';
  
  if (type === 'start') {
    bgColor = 'bg-blue-900/30 border-blue-500';
    textColor = 'text-blue-200';
  } else if (type === 'decision') {
    bgColor = 'bg-yellow-900/30 border-yellow-500';
    textColor = 'text-yellow-200';
  }

  return (
    <div className={`p-4 rounded border ${bgColor} ${textColor} text-center font-medium shadow-lg max-w-xs mx-auto text-sm`}>
      {text}
    </div>
  );
};

export const SOP_DATA: Record<string, SOPSection> = {
  'overview': {
    id: 'overview',
    title: 'Overview & Daily Operations',
    purpose: 'To define the standardized procedures for Test Administrators at FETS Online Examination & Testing Centres, ensuring uniform operations, secure exam delivery, and effective emergency response.',
    scope: 'This SOP applies to all Test Administrators involved in assessment operations across all FETS branches.',
    responsibilities: [
      'Maintain exam integrity, confidentiality, and fairness.',
      'Execute secure candidate check-in, monitoring, and incident reporting.',
      'Follow emergency protocols and ensure end-of-day compliance.'
    ],
    steps: [
      {
        heading: 'Core Operational Philosophy',
        content: [
          'Uniformity: Every candidate experiences the same conditions.',
          'Security: Prevention of malpractice is the primary goal.',
          'Service: Professional and calm demeanor at all times.'
        ]
      }
    ],
    diagram: (
      <div className="flex flex-col gap-1">
        <FlowBox text="Start of Day (T-Minus 60 Min)" type="start" />
        <ArrowDown />
        <FlowBox text="Branch Opening & System Checks" />
        <ArrowDown />
        <FlowBox text="Candidate Check-In & Security" />
        <ArrowDown />
        <FlowBox text="Exam Delivery & Active Monitoring" />
        <ArrowDown />
        <div className="flex justify-center my-2 relative h-12 w-full">
           {/* Branching Logic Visual */}
           <div className="absolute left-1/2 -translate-x-1/2 top-0 h-6 border-l-2 border-gray-500"></div>
           <div className="absolute left-[calc(50%-80px)] top-6 w-[160px] border-t-2 border-gray-500"></div>
           <div className="absolute left-[calc(50%-80px)] top-6 h-6 border-l-2 border-gray-500"></div>
           <div className="absolute left-[calc(50%+80px)] top-6 h-6 border-r-2 border-gray-500"></div>
        </div>
        <div className="flex justify-center gap-8">
            <div className="w-1/2 flex flex-col items-center">
              <FlowBox text="Incident Occurs?" type="decision" />
              <span className="text-xs text-gray-500 mt-1">(See Emergency SOP)</span>
            </div>
            <div className="w-1/2 flex flex-col items-center">
               <FlowBox text="Standard Completion" />
               <span className="text-xs text-gray-500 mt-1">(Proceed to End)</span>
            </div>
        </div>
        <ArrowDown />
        <FlowBox text="End of Day Closing" type="start" />
      </div>
    )
  },
  'opening': {
    id: 'opening',
    title: 'Branch Opening Procedure',
    purpose: 'To ensure all facility and technical systems are fully operational before the first candidate arrives.',
    scope: 'Daily morning routine for the Test Administrator.',
    responsibilities: [
      'Arrive 1 hour before the first scheduled exam slot.',
      'Ensure physical and digital security of the test center.'
    ],
    steps: [
      {
        heading: 'Facility Inspection',
        content: [
          'Unlock main entrance and disable night security alarm.',
          'Switch on main power, lighting, and HVAC systems.',
          'Inspect exam hall for cleanliness, ventilation, and leftover debris.',
          'Unlock and inspect lockers for functionality.'
        ]
      },
      {
        heading: 'Technical Setup',
        content: [
          'Power on Server PC first, followed by Admin Station.',
          'Power on all candidate workstations.',
          'Verify internet connectivity and speed.',
          'Launch Exam Delivery Software (Proctor Station) and verify connection to central servers.',
          'Test biometric devices and cameras.'
        ]
      },
      {
        heading: 'Administrative Prep',
        content: [
          'Review the Daily Schedule Report.',
          'Print necessary rosters or scratch paper logs.',
          'Complete the "Pre-Exam Checklist".'
        ]
      }
    ],
    diagram: (
      <div className="flex flex-col gap-1">
        <FlowBox text="Arrive 60 Mins Early" type="start" />
        <ArrowDown />
        <FlowBox text="Facility Power & HVAC On" />
        <ArrowDown />
        <FlowBox text="Server & Workstation Boot" />
        <ArrowDown />
        <FlowBox text="Software Connectivity Check" />
        <ArrowDown />
        <FlowBox text="CCTV & Audio Verification" />
        <ArrowDown />
        <FlowBox text="Complete Pre-Exam Checklist" type="decision" />
        <ArrowDown />
        <FlowBox text="Open Doors for Candidates" type="start" />
      </div>
    )
  },
  'checkin': {
    id: 'checkin',
    title: 'Candidate Check-In Procedure',
    purpose: 'To verify candidate identity and prevent unauthorized materials from entering the testing room.',
    scope: 'Applies to every candidate entering the facility.',
    responsibilities: [
      'Act as both Greeter and Security Enforcer.',
      'Verify ID authenticity.',
      'Enforce personal item storage policies.'
    ],
    steps: [
      {
        heading: 'Identity Verification',
        content: [
          'Greet candidate professionally.',
          'Request valid, government-issued ID (original only).',
          'Match photo on ID with the candidate standing in front of you.',
          'Compare ID photo with exam roster/previous attempt photos if available.',
          'Check ID expiration date and signature.'
        ]
      },
      {
        heading: 'Security & Storage',
        content: [
          'Direct candidate to place ALL personal items (phone, watch, wallet, bags) in an assigned locker.',
          'Candidate must turn pockets inside out.',
          'Inspect eyewear for cameras/electronics.',
          'Check sleeves and ankles for hidden notes.',
          'Hand over locker key to candidate.'
        ]
      },
      {
        heading: 'Exam Admission',
        content: [
          'Capture candidate photo/biometrics (if required by exam sponsor).',
          'Provide scratch paper/pencils as per specific exam rules.',
          'Read the "Exam Rules Script" to the candidate.',
          'Escort candidate to their assigned workstation.'
        ]
      }
    ],
    diagram: (
      <div className="flex flex-col gap-1">
        <FlowBox text="Candidate Arrival" type="start" />
        <ArrowDown />
        <FlowBox text="Greet & Request ID" />
        <ArrowDown />
        <FlowBox text="Verify Identity (Match Photo/Data)" type="decision" />
        <ArrowDown />
        <FlowBox text="Store Personal Items in Locker" />
        <ArrowDown />
        <FlowBox text="Physical Inspection (Pockets/Glasses)" />
        <ArrowDown />
        <FlowBox text="Capture Biometrics/Log Admit Time" />
        <ArrowDown />
        <FlowBox text="Escort to Workstation" type="start" />
      </div>
    )
  },
  'monitoring': {
    id: 'monitoring',
    title: 'Exam Monitoring Procedure',
    purpose: 'To detect and prevent academic dishonesty and ensure a distraction-free environment.',
    scope: 'Duration of all active exam sessions.',
    responsibilities: [
      'Maintain constant visual and audio surveillance.',
      'Address technical issues immediately.',
      'Log all irregularities.'
    ],
    steps: [
      {
        heading: 'Surveillance Requirements',
        content: [
          'NEVER leave the monitoring area unattended while candidates are testing.',
          'Keep surveillance audio ON to hear whispering or unauthorized noises.',
          'Monitor screen views on the Admin Station for unauthorized applications.'
        ]
      },
      {
        heading: 'Active Proctoring',
        content: [
          'Perform a silent physical walk-through of the exam room every 15-20 minutes.',
          'Stand behind candidates (out of immediate view) to observe behavior.',
          'Look for: Excessive fidgeting, looking at other screens, mouthing words, reaching into pockets.'
        ]
      },
      {
        heading: 'Intervention',
        content: [
          'If a minor rule is broken (e.g., talking to self), issue a soft warning.',
          'If fraud is observed (e.g., cheat sheet), pause exam immediately and confiscate evidence.',
          'Log all breaks, technical errors, and warnings in the Daily Occurrence Book.'
        ]
      },
    ],
    diagram: (
      <div className="flex flex-col gap-1">
        <FlowBox text="Active Testing Session" type="start" />
        <ArrowDown />
        <div className="grid grid-cols-2 gap-4">
           <FlowBox text="CCTV/Screen Monitoring" />
           <FlowBox text="Physical Walkthrough (15m)" />
        </div>
        <ArrowDown />
        <FlowBox text="Irregularity Observed?" type="decision" />
        <div className="flex justify-center gap-2">
            <div className="border-l-2 border-gray-500 h-6"></div>
            <div className="border-r-2 border-gray-500 h-6"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
           <FlowBox text="Minor: Issue Warning" />
           <FlowBox text="Major: Terminate Exam" />
        </div>
        <ArrowDown />
        <FlowBox text="Log Incident in Report" />
      </div>
    )
  },
  'emergency': {
    id: 'emergency',
    title: 'Emergency & Incident Response',
    purpose: 'To ensure safety of candidates and integrity of exam data during unforeseen events.',
    scope: 'Power outages, fire alarms, medical emergencies, or server failures.',
    responsibilities: [
      'Prioritize human safety above exam results.',
      'Communicate clearly and calmly.',
      'Report to FETS HQ immediately.'
    ],
    steps: [
      {
        heading: 'Power Failure / Technical Crash',
        content: [
          'Immediately note the time of failure.',
          'Ask candidates to remain seated; do not let them leave the room.',
          'Check UPS/Generator status.',
          'If outage > 10 mins, contact Vendor Support Helpline.',
          'If exam cannot resume, file "Exam Interruption Report" for rescheduling.'
        ]
      },
      {
        heading: 'Fire / Building Evacuation',
        content: [
          'Stop all exams immediately.',
          'Instruct candidates to leave belongings and evacuate via nearest exit.',
          'Take the Daily Attendance Roster with you.',
          'Conduct head count at assembly point.',
          'Notify FETS Management.'
        ]
      }
    ],
    diagram: (
      <div className="flex flex-col gap-1">
        <FlowBox text="Incident Triggered" type="decision" />
        <ArrowDown />
        <div className="flex flex-row justify-center gap-4">
           <div className="flex flex-col gap-2 w-1/2">
              <FlowBox text="Technical / Power" />
              <ArrowDown />
              <FlowBox text="Pause Exam Timer" />
              <ArrowDown />
              <FlowBox text="Contact Support" />
           </div>
           <div className="flex flex-col gap-2 w-1/2">
              <FlowBox text="Safety / Fire" />
              <ArrowDown />
              <FlowBox text="Evacuate Immediately" />
              <ArrowDown />
              <FlowBox text="Headcount Outside" />
           </div>
        </div>
        <ArrowDown />
        <FlowBox text="File Incident Report" type="start" />
      </div>
    )
  },
  'closing': {
    id: 'closing',
    title: 'End-of-Day Closing Procedure',
    purpose: 'To secure the facility and data after operations conclude.',
    scope: 'Daily evening routine.',
    responsibilities: [
      'Verify all candidates have departed.',
      'Secure data and hardware.',
      'Power down facility.'
    ],
    steps: [
      {
        heading: 'Operational Shutdown',
        content: [
          'Ensure all candidates have finished exams and collected belongings.',
          'Verify all lockers are empty and keys returned.',
          'Collect used scratch paper and shred/store securely.',
          'Upload any offline exam logs to the central server.'
        ]
      },
      {
        heading: 'Facility Shutdown',
        content: [
          'Shut down all candidate workstations.',
          'Shut down Admin and Server PCs (unless night updates scheduled).',
          'Turn off lights and HVAC.',
          'Ensure windows and emergency exits are locked.',
          'Activate security alarm system.',
          'Lock main entrance.'
        ]
      },
      {
        heading: 'Reporting',
        content: [
          'Complete the "Post-Exam Checklist".',
          'Send "End of Day Report" email to Supervisors.'
        ]
      }
    ],
    diagram: (
      <div className="flex flex-col gap-1">
        <FlowBox text="Last Candidate Departs" type="start" />
        <ArrowDown />
        <FlowBox text="Verify Lockers Empty" />
        <ArrowDown />
        <FlowBox text="Upload Exam Logs" />
        <ArrowDown />
        <FlowBox text="System Shutdown" />
        <ArrowDown />
        <FlowBox text="Facility Secure" />
        <ArrowDown />
        <FlowBox text="Post-Exam Checklist" />
        <ArrowDown />
        <FlowBox text="Activate Alarm & Leave" type="start" />
      </div>
    )
  },
  'compliance': {
    id: 'compliance',
    title: 'Compliance & Penalties',
    purpose: 'To outline the consequences of failing to adhere to FETS SOPs.',
    scope: 'All employees and contractors.',
    responsibilities: [
      'Adhere strictly to all outlined procedures.',
      'Report any witnessed non-compliance.'
    ],
    steps: [
      {
        heading: 'Zero Tolerance Policy',
        content: [
          'Collusion with candidates (helping them cheat) results in immediate termination and legal action.',
          'Theft of exam content is a criminal offense.'
        ]
      },
      {
        heading: 'Consequences of SOP Breach',
        content: [
          'Minor (Procedural): Retraining and Written Warning.',
          'Major (Security/Integrity): Suspension pending investigation.',
          'Critical (Fraud/Theft): Contract termination and Blacklisting.'
        ]
      },
      {
        heading: 'Guidance',
        content: [
          'When unsure about a procedure, ALWAYS consult your immediate supervisor.',
          'Ignorance of the SOP is not a valid defense.'
        ]
      }
    ],
    diagram: (
      <div className="flex flex-col gap-1">
        <FlowBox text="SOP Violation Detected" type="decision" />
        <ArrowDown />
        <div className="flex justify-center gap-1 h-8 w-full relative">
           <div className="absolute left-1/2 top-0 h-4 border-l-2 border-gray-600"></div>
           <div className="absolute left-[20%] top-4 w-[60%] border-t-2 border-gray-600"></div>
           <div className="absolute left-[20%] top-4 h-4 border-l-2 border-gray-600"></div>
           <div className="absolute left-[80%] top-4 h-4 border-r-2 border-gray-600"></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
           <div className="text-center p-2 border border-gray-600 rounded bg-[#111]">
              <p className="text-white font-bold text-xs">Minor</p>
              <p className="text-[10px] text-gray-400">Warning</p>
           </div>
           <div className="text-center p-2 border border-yellow-600 rounded bg-[#111]">
              <p className="text-yellow-500 font-bold text-xs">Major</p>
              <p className="text-[10px] text-gray-400">Suspension</p>
           </div>
           <div className="text-center p-2 border border-red-600 rounded bg-[#111]">
              <p className="text-red-500 font-bold text-xs">Critical</p>
              <p className="text-[10px] text-gray-400">Termination</p>
           </div>
        </div>
      </div>
    )
  }
};
