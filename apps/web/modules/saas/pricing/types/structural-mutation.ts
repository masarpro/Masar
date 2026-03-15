/**
 * أنواع بيانات الـ mutation للعناصر الإنشائية.
 * تُستخدم بدل `as any` لتوفير type assertion أوضح
 * عند استدعاء createMutation/updateMutation/deleteMutation.
 */

export interface StructuralItemCreateInput {
	organizationId: string;
	costStudyId: string;
	category: string;
	subCategory?: string;
	name: string;
	description?: string;
	dimensions?: Record<string, number | string | boolean>;
	quantity: number;
	unit: string;
	concreteVolume?: number;
	concreteType?: string;
	steelWeight?: number;
	steelRatio?: number;
	wastagePercent?: number;
	materialCost?: number;
	laborCost?: number;
	totalCost?: number;
}

export interface StructuralItemUpdateInput extends Partial<Omit<StructuralItemCreateInput, 'organizationId' | 'costStudyId'>> {
	id: string;
	organizationId: string;
	costStudyId: string;
	sortOrder?: number;
}

export interface StructuralItemDeleteInput {
	id: string;
	organizationId: string;
	costStudyId: string;
}
