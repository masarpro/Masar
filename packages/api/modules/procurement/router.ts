// Procurement Module Router — إدارة المشتريات
// PR → RFQ → PO → GR → Vendor Invoice → Payment

// Vendors
import { vendorsList } from "./procedures/vendors/list";
import { vendorsGetById } from "./procedures/vendors/get-by-id";
import { vendorsCreate } from "./procedures/vendors/create";
import { vendorsUpdate } from "./procedures/vendors/update";
import { vendorsDelete } from "./procedures/vendors/delete";

// Purchase Requests
import { prList } from "./procedures/purchase-requests/list";
import { prGetById } from "./procedures/purchase-requests/get-by-id";
import { prCreate } from "./procedures/purchase-requests/create";
import { prUpdate } from "./procedures/purchase-requests/update";
import { prUpdateItems } from "./procedures/purchase-requests/update-items";
import { prApprove } from "./procedures/purchase-requests/approve";
import { prReject } from "./procedures/purchase-requests/reject";
import { prCancel } from "./procedures/purchase-requests/cancel";

// RFQ
import { rfqList } from "./procedures/rfq/list";
import { rfqGetById } from "./procedures/rfq/get-by-id";
import { rfqCreate } from "./procedures/rfq/create";
import { rfqUpdate } from "./procedures/rfq/update";
import { rfqAddResponse } from "./procedures/rfq/add-response";
import { rfqEvaluate } from "./procedures/rfq/evaluate";
import { rfqAward } from "./procedures/rfq/award";

// Purchase Orders
import { poList } from "./procedures/purchase-orders/list";
import { poGetById } from "./procedures/purchase-orders/get-by-id";
import { poCreate } from "./procedures/purchase-orders/create";
import { poUpdate } from "./procedures/purchase-orders/update";
import { poApprove } from "./procedures/purchase-orders/approve";
import { poSend } from "./procedures/purchase-orders/send";
import { poCancel } from "./procedures/purchase-orders/cancel";

// Goods Receipts
import { grList } from "./procedures/goods-receipts/list";
import { grGetById } from "./procedures/goods-receipts/get-by-id";
import { grCreate } from "./procedures/goods-receipts/create";
import { grInspect } from "./procedures/goods-receipts/inspect";

// Vendor Invoices
import { viList } from "./procedures/vendor-invoices/list";
import { viGetById } from "./procedures/vendor-invoices/get-by-id";
import { viCreate } from "./procedures/vendor-invoices/create";
import { viUpdate } from "./procedures/vendor-invoices/update";
import { viApprove } from "./procedures/vendor-invoices/approve";
import { viPay } from "./procedures/vendor-invoices/pay";

// Dashboard
import { dashboardGetStats } from "./procedures/dashboard/get-stats";

export const procurementRouter = {
	// الموردين
	vendors: {
		list: vendorsList,
		getById: vendorsGetById,
		create: vendorsCreate,
		update: vendorsUpdate,
		delete: vendorsDelete,
	},

	// طلبات الشراء
	purchaseRequests: {
		list: prList,
		getById: prGetById,
		create: prCreate,
		update: prUpdate,
		updateItems: prUpdateItems,
		approve: prApprove,
		reject: prReject,
		cancel: prCancel,
	},

	// طلبات عروض الأسعار
	rfq: {
		list: rfqList,
		getById: rfqGetById,
		create: rfqCreate,
		update: rfqUpdate,
		addResponse: rfqAddResponse,
		evaluate: rfqEvaluate,
		award: rfqAward,
	},

	// أوامر الشراء
	purchaseOrders: {
		list: poList,
		getById: poGetById,
		create: poCreate,
		update: poUpdate,
		approve: poApprove,
		send: poSend,
		cancel: poCancel,
	},

	// استلام البضاعة
	goodsReceipts: {
		list: grList,
		getById: grGetById,
		create: grCreate,
		inspect: grInspect,
	},

	// فواتير الموردين
	vendorInvoices: {
		list: viList,
		getById: viGetById,
		create: viCreate,
		update: viUpdate,
		approve: viApprove,
		pay: viPay,
	},

	// لوحة التحكم
	dashboard: dashboardGetStats,
};
