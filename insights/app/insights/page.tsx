"use client";

import Topbar from "@/components/topbar/topbar";
import {
    SubscriptionCard,
    LabTestsVolume,
    ImagingRadiology,
    OperatingRoomsUtilization,
    PatientToBedRatio,
    IncomingTransferRequests,
    OutgoingTransferRequests,
    ICUVacantBeds,
    PharmacyPrescription,
    NurseToPatientRatio,
} from "./components";

const subscriptionData = [
    {
        badge: "ME",
        badgeColor: "purple" as const,
        title: "Medical Equipment Lease",
        provider: "MedEquip Pro",
        amount: "1,170",
        nextPaymentDate: "July 12, 2026",
    },
    {
        badge: "HC",
        badgeColor: "teal" as const,
        title: "Cloud EHR System",
        provider: "HealthCloud",
        amount: "892",
        nextPaymentDate: "July 20, 2026",
    },
    {
        badge: "PS",
        badgeColor: "coral" as const,
        title: "Pharmacy Management",
        provider: "PharmSoft",
        amount: "645",
        nextPaymentDate: "July 25, 2026",
    },
    {
        badge: "LT",
        badgeColor: "green" as const,
        title: "Lab Information System",
        provider: "LabTech Solutions",
        amount: "1,234",
        nextPaymentDate: "July 28, 2026",
    },
];

const ClinicalOperations = () => {
    return (
        <div className="flex flex-col flex-1">
            <Topbar
                title="Clinical Operations"
            />
            <div className="w-full flex flex-col gap-[15px] overflow-auto pt-[15px]">
                {/* Subscription Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {subscriptionData.map((card, index) => (
                        <div 
                            key={index} 
                            className="animate-slide-in-up"
                            style={{ animationDelay: `${index * 100}ms`, opacity: 0, animationFillMode: 'forwards' }}
                        >
                            <SubscriptionCard {...card} />
                        </div>
                    ))}
                </div>

                {/* Lab Tests & Imaging Row */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="animate-slide-in-up" style={{ animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
                        <LabTestsVolume />
                    </div>
                    <div className="animate-slide-in-up" style={{ animationDelay: '300ms', opacity: 0, animationFillMode: 'forwards' }}>
                        <ImagingRadiology />
                    </div>
                </div>

                {/* Operating Rooms, Patient-to-Bed, Transfer Requests Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[2fr_2fr_1.5fr] gap-4">
                    <div className="animate-slide-in-up" style={{ animationDelay: '400ms', opacity: 0, animationFillMode: 'forwards' }}>
                        <OperatingRoomsUtilization />
                    </div>
                    <div className="animate-slide-in-up" style={{ animationDelay: '500ms', opacity: 0, animationFillMode: 'forwards' }}>
                        <PatientToBedRatio />
                    </div>
                    <div className="flex flex-col gap-2 animate-slide-in-up" style={{ animationDelay: '600ms', opacity: 0, animationFillMode: 'forwards' }}>
                        <IncomingTransferRequests />
                        <OutgoingTransferRequests />
                    </div>
                </div>

                {/* Bottom Section - ICU, Pharmacy, Nurse Ratio */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <div className="animate-slide-in-up" style={{ animationDelay: '700ms', opacity: 0, animationFillMode: 'forwards' }}>
                        <ICUVacantBeds />
                    </div>
                    <div className="animate-slide-in-up" style={{ animationDelay: '800ms', opacity: 0, animationFillMode: 'forwards' }}>
                        <PharmacyPrescription />
                    </div>
                    <div className="animate-slide-in-up" style={{ animationDelay: '900ms', opacity: 0, animationFillMode: 'forwards' }}>
                        <NurseToPatientRatio />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClinicalOperations;
