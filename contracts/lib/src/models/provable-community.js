"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.CommunityState = exports.ProvableCommunity = void 0;
var snarkyjs_1 = require("snarkyjs");
var uid_js_1 = require("../lib/uid.js");
var datetime_js_1 = require("../lib/datetime.js");
var entity_state_js_1 = require("./entity-state.js");
var COMMUNITY_STATES = [
    "REVISION", "APPROVED", "PAYMENT", "ACTIVE",
    "DELETED", "CANCELED", "PAUSED"
];
var CommunityState = new entity_state_js_1.EntityState(COMMUNITY_STATES);
exports.CommunityState = CommunityState;
var ProvableCommunity = /** @class */ (function (_super) {
    __extends(ProvableCommunity, _super);
    function ProvableCommunity(json) {
        var _this = _super.call(this, json) || this;
        _this.fromJSON(json);
        return _this;
    }
    ProvableCommunity.prototype.fromJSON = function (json) {
        this.uid = uid_js_1.UID.toField(json.uid);
        this.accountId = json.accountId && snarkyjs_1.PublicKey.fromBase58(json.accountId) || this.accountId || snarkyjs_1.PublicKey.empty();
        this.name = snarkyjs_1.CircuitString.fromString(json.name || this.name || "");
        this.image = snarkyjs_1.CircuitString.fromString(json.image || this.image || "");
        this.description = snarkyjs_1.CircuitString.fromString(json.description || this.description || "");
        this.state = snarkyjs_1.CircuitString.fromString(json.state || this.state || "");
        this.adminUid = uid_js_1.UID.toField(json.adminUid || this.adminUid.toString());
        this.createdUTC = datetime_js_1.UTCDateTime.fromString((json.createdUTC || this.createdUTC).toString());
        this.updatedUTC = datetime_js_1.UTCDateTime.fromString((json.updatedUTC || this.updatedUTC).toString());
        this.approvedUTC = datetime_js_1.UTCDateTime.fromString((json.approvedUTC || this.approvedUTC || 0).toString());
        return this;
    };
    ProvableCommunity.prototype.toJSON = function () {
        return {
            uid: this.uid.toString(),
            adminUid: this.adminUid.toString(),
            accountId: (this.accountId || snarkyjs_1.PublicKey.empty()).toBase58(),
            name: this.name.toString(),
            description: this.description.toString(),
            image: this.image.toString(),
            state: this.state.toString(),
            approvedUTC: this.approvedUTC.toString(),
            createdUTC: this.createdUTC.toString(),
            updatedUTC: this.updatedUTC.toString()
        };
    };
    ProvableCommunity.prototype.hash = function () {
        var fields = [];
        fields = fields
            .concat(this.uid.toFields())
            .concat(this.accountId.toFields())
            .concat(this.name.toFields())
            .concat(this.description.toFields())
            .concat(this.state.toFields())
            .concat(this.image.toFields())
            .concat(this.approvedUTC.toFields())
            .concat(this.createdUTC.toFields())
            .concat(this.updatedUTC.toFields())
            .concat(this.adminUid.toFields());
        return snarkyjs_1.Poseidon.hash(fields);
    };
    ProvableCommunity.prototype.key = function () {
        return this.uid;
    };
    return ProvableCommunity;
}((0, snarkyjs_1.Struct)({
    uid: snarkyjs_1.Field,
    state: snarkyjs_1.CircuitString,
    accountId: snarkyjs_1.PublicKey,
    name: snarkyjs_1.CircuitString,
    description: snarkyjs_1.CircuitString,
    image: snarkyjs_1.CircuitString,
    createdUTC: snarkyjs_1.Field,
    updatedUTC: snarkyjs_1.Field,
    approvedUTC: snarkyjs_1.Field,
    adminUid: snarkyjs_1.Field
})));
exports.ProvableCommunity = ProvableCommunity;
