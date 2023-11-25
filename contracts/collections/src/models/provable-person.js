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
exports.PersonState = exports.ProvablePerson = void 0;
var snarkyjs_1 = require("snarkyjs");
var uid_js_1 = require("../lib/uid.js");
var datetime_js_1 = require("../lib/datetime.js");
var entity_state_js_1 = require("./entity-state.js");
var PersonState = new entity_state_js_1.EntityState([
    // valid states
    "INITIAL", "ACTIVE", "CANCELED", "PAUSED"
], {
    // transitions
    "INITIAL": ["ACTIVE", "CANCELED", "PAUSED"],
    "ACTIVE": ["CANCELED", "PAUSED"],
    "PAUSED": ["ACTIVE", "CANCELED"],
    "CANCELED": []
});
exports.PersonState = PersonState;
var ProvablePerson = /** @class */ (function (_super) {
    __extends(ProvablePerson, _super);
    function ProvablePerson(json) {
        var _this = _super.call(this, json) || this;
        _this.fromJSON(json);
        return _this;
    }
    ProvablePerson.prototype.fromJSON = function (json) {
        this.uid = uid_js_1.UID.toField(json.uid);
        this.accountId = json.accountId && snarkyjs_1.PublicKey.fromBase58(json.accountId) || this.accountId || snarkyjs_1.PublicKey.empty();
        this.fullName = snarkyjs_1.CircuitString.fromString(json.fullName || this.fullName || "");
        this.image = snarkyjs_1.CircuitString.fromString(json.image || this.image || "");
        this.description = snarkyjs_1.CircuitString.fromString(json.description || this.description || "");
        this.state = snarkyjs_1.CircuitString.fromString(json.state || this.state || "");
        this.telegram = snarkyjs_1.CircuitString.fromString(json.telegram || this.telegram || "");
        this.email = snarkyjs_1.CircuitString.fromString(json.email || this.email || "");
        this.phone = snarkyjs_1.CircuitString.fromString(json.phone || this.phone || "");
        this.createdUTC = datetime_js_1.UTCDateTime.fromString((json.createdUTC || this.createdUTC).toString());
        this.updatedUTC = datetime_js_1.UTCDateTime.fromString((json.updatedUTC || this.updatedUTC).toString());
        this.approvedUTC = datetime_js_1.UTCDateTime.fromString((json.approvedUTC || this.approvedUTC || 0).toString());
    };
    ProvablePerson.prototype.toJSON = function () {
        return {
            uid: this.uid.toString(),
            accountId: (this.accountId || snarkyjs_1.PublicKey.empty()).toBase58(),
            fullName: this.fullName.toString(),
            description: this.description.toString(),
            image: this.image.toString(),
            state: this.state.toString(),
            approvedUTC: this.approvedUTC.toString(),
            createdUTC: this.createdUTC.toString(),
            updatedUTC: this.updatedUTC.toString(),
            email: this.email.toString(),
            phone: this.phone.toString(),
            telegram: this.telegram.toString()
        };
    };
    ProvablePerson.prototype.hash = function () {
        var fields = [];
        fields = fields
            .concat(this.uid.toFields())
            .concat(this.accountId.toFields())
            .concat(this.fullName.toFields())
            .concat(this.description.toFields())
            .concat(this.state.toFields())
            .concat(this.image.toFields())
            .concat(this.approvedUTC.toFields())
            .concat(this.createdUTC.toFields())
            .concat(this.updatedUTC.toFields())
            .concat(this.email.toFields())
            .concat(this.phone.toFields())
            .concat(this.telegram.toFields());
        return snarkyjs_1.Poseidon.hash(fields);
        /*
            let f1 = this.uid.toFields();
            let f2 = this.accountId.toFields();
            let f3 = this.fullName.toFields();
            let f4 = this.description.toFields();
            let f5 = this.state.toFields();
            let f6 = this.image.toFields();
            let f7 = [];// this.approvedUTC.toFields();
            let f8 = [];//this.createdUTC.toFields();
            let f9 = [];//this.updatedUTC.toFields();
            let f10 = this.email.toFields();
            let f11 = this.phone.toFields();
            let f12 = this.telegram.toFields();
            let fields = f1.concat(f2).concat(f3).concat(f4).concat(f5).concat(f6).concat(f7).concat(f8).concat(f9).concat(f10).concat(f11).concat(f12);
        */
    };
    ProvablePerson.prototype.key = function () {
        return this.uid;
    };
    return ProvablePerson;
}((0, snarkyjs_1.Struct)({
    uid: snarkyjs_1.Field,
    state: snarkyjs_1.CircuitString,
    accountId: snarkyjs_1.PublicKey,
    fullName: snarkyjs_1.CircuitString,
    description: snarkyjs_1.CircuitString,
    image: snarkyjs_1.CircuitString,
    telegram: snarkyjs_1.CircuitString,
    email: snarkyjs_1.CircuitString,
    phone: snarkyjs_1.CircuitString,
    createdUTC: snarkyjs_1.Field,
    updatedUTC: snarkyjs_1.Field,
    approvedUTC: snarkyjs_1.Field
})));
exports.ProvablePerson = ProvablePerson;
