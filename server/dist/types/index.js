"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketSource = exports.TicketStatus = exports.TicketPriority = exports.TicketCategory = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["MANAGER"] = "manager";
    UserRole["AGENT"] = "agent";
})(UserRole || (exports.UserRole = UserRole = {}));
var TicketCategory;
(function (TicketCategory) {
    TicketCategory["COMPLAINT"] = "complaint";
    TicketCategory["SERVICE_REQUEST"] = "service_request";
    TicketCategory["INQUIRY"] = "inquiry";
    TicketCategory["HOUSEKEEPING"] = "housekeeping";
    TicketCategory["FOOD_BEVERAGE"] = "food_beverage";
    TicketCategory["FRONT_DESK"] = "front_desk";
    TicketCategory["MAINTENANCE"] = "maintenance";
    TicketCategory["IT_SUPPORT"] = "it_support";
})(TicketCategory || (exports.TicketCategory = TicketCategory = {}));
var TicketPriority;
(function (TicketPriority) {
    TicketPriority["LOW"] = "low";
    TicketPriority["MEDIUM"] = "medium";
    TicketPriority["HIGH"] = "high";
    TicketPriority["CRITICAL"] = "critical";
})(TicketPriority || (exports.TicketPriority = TicketPriority = {}));
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["OPEN"] = "open";
    TicketStatus["IN_PROGRESS"] = "in_progress";
    TicketStatus["ON_HOLD"] = "on_hold";
    TicketStatus["ESCALATED"] = "escalated";
    TicketStatus["RESOLVED"] = "resolved";
    TicketStatus["CLOSED"] = "closed";
    TicketStatus["CANCELLED"] = "cancelled";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
var TicketSource;
(function (TicketSource) {
    TicketSource["ONLINE_REVIEW"] = "online_review";
    TicketSource["SURVEY"] = "survey";
    TicketSource["WHATSAPP"] = "whatsapp";
    TicketSource["CHATBOT"] = "chatbot";
    TicketSource["MANUAL"] = "manual";
    TicketSource["PHONE"] = "phone";
    TicketSource["EMAIL"] = "email";
})(TicketSource || (exports.TicketSource = TicketSource = {}));
//# sourceMappingURL=index.js.map