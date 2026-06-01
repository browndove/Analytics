"use client";

import * as React from "react";
import {
	CallKPIRow,
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

const ClinicalOperationsPage = ({ data }: { data?: any }) => {
	const cm = data?.call_metrics;

	return (
		<div className="w-full flex flex-col gap-[15px]">
			<CallKPIRow data={data} />

			{/* Lab Tests & Imaging Row */}
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
				<div className="animate-slide-in-up" style={{ animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
					<LabTestsVolume callMetrics={cm} />
				</div>
				<div className="animate-slide-in-up" style={{ animationDelay: '300ms', opacity: 0, animationFillMode: 'forwards' }}>
					<ImagingRadiology callMetrics={cm} />
				</div>
			</div>

			{/* Operating Rooms, Patient-to-Bed, Transfer Requests Row */}
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[2fr_2fr_1.5fr] gap-4">
				<div className="animate-slide-in-up" style={{ animationDelay: '400ms', opacity: 0, animationFillMode: 'forwards' }}>
					<OperatingRoomsUtilization callMetrics={cm} />
				</div>
				<div className="animate-slide-in-up" style={{ animationDelay: '500ms', opacity: 0, animationFillMode: 'forwards' }}>
					<PatientToBedRatio callMetrics={cm} />
				</div>
				<div className="flex flex-col gap-2 animate-slide-in-up" style={{ animationDelay: '600ms', opacity: 0, animationFillMode: 'forwards' }}>
					<IncomingTransferRequests callMetrics={cm} />
					<OutgoingTransferRequests callMetrics={cm} />
				</div>
			</div>

			{/* Bottom Section - ICU, Pharmacy, Nurse Ratio */}
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				<div className="animate-slide-in-up" style={{ animationDelay: '700ms', opacity: 0, animationFillMode: 'forwards' }}>
					<ICUVacantBeds callMetrics={cm} />
				</div>
				<div className="animate-slide-in-up" style={{ animationDelay: '800ms', opacity: 0, animationFillMode: 'forwards' }}>
					<PharmacyPrescription callMetrics={cm} />
				</div>
				<div className="animate-slide-in-up" style={{ animationDelay: '900ms', opacity: 0, animationFillMode: 'forwards' }}>
					<NurseToPatientRatio callMetrics={cm} />
				</div>
			</div>

		</div>
	);
};

export default ClinicalOperationsPage;
