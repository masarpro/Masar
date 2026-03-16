"use client";

import type { OtherStructuralInput, OtherStructuralElementType } from "../../../../../types/other-structural";
import { SepticTankForm } from "./SepticTankForm";
import { WaterTankGroundForm } from "./WaterTankGroundForm";
import { WaterTankElevatedForm } from "./WaterTankElevatedForm";
import { ElevatorPitForm } from "./ElevatorPitForm";
import { RetainingWallForm } from "./RetainingWallForm";
import { BoundaryWallForm } from "./BoundaryWallForm";
import { RampForm } from "./RampForm";
import { DomeForm } from "./DomeForm";
import { MinaretForm } from "./MinaretForm";
import { ConcreteDecorForm } from "./ConcreteDecorForm";
import { CustomElementForm } from "./CustomElementForm";

export interface ElementFormProps<T extends OtherStructuralInput = OtherStructuralInput> {
	data: T;
	onChange: (data: T) => void;
}

interface ElementFormWrapperProps {
	elementType: OtherStructuralElementType;
	data: OtherStructuralInput;
	onChange: (data: OtherStructuralInput) => void;
}

export function ElementFormWrapper({ elementType, data, onChange }: ElementFormWrapperProps) {
	switch (elementType) {
		case 'SEPTIC_TANK':
			return <SepticTankForm data={data as any} onChange={onChange as any} />;
		case 'WATER_TANK_GROUND':
			return <WaterTankGroundForm data={data as any} onChange={onChange as any} />;
		case 'WATER_TANK_ELEVATED':
			return <WaterTankElevatedForm data={data as any} onChange={onChange as any} />;
		case 'ELEVATOR_PIT':
			return <ElevatorPitForm data={data as any} onChange={onChange as any} />;
		case 'RETAINING_WALL':
			return <RetainingWallForm data={data as any} onChange={onChange as any} />;
		case 'BOUNDARY_WALL':
			return <BoundaryWallForm data={data as any} onChange={onChange as any} />;
		case 'RAMP':
			return <RampForm data={data as any} onChange={onChange as any} />;
		case 'DOME':
			return <DomeForm data={data as any} onChange={onChange as any} />;
		case 'MINARET':
			return <MinaretForm data={data as any} onChange={onChange as any} />;
		case 'CONCRETE_DECOR':
			return <ConcreteDecorForm data={data as any} onChange={onChange as any} />;
		case 'CUSTOM_ELEMENT':
			return <CustomElementForm data={data as any} onChange={onChange as any} />;
	}
}
