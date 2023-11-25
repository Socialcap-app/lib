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
exports.MemberRole = exports.ProvableMember = void 0;
var snarkyjs_1 = require("snarkyjs");
var uid_js_1 = require("../lib/uid.js");
var entity_state_js_1 = require("./entity-state.js");
var MemberRole = new entity_state_js_1.EntityState([
    // valid roles
    // 0-Not a member, 1-Plain member, 2-Validator, 3-Auditor 
    "NONE", "PLAIN", "VALIDATOR", "AUDITOR"
], {
    // transitions
    "NONE": ["PLAIN"],
    "PLAIN": ["VALIDATOR", "AUDITOR"],
    "VALIDATOR": ["PLAIN", "AUDITOR"],
    "AUDITOR": ["PLAIN", "VALIDATOR"]
});
exports.MemberRole = MemberRole;
var ProvableMember = /** @class */ (function (_super) {
    __extends(ProvableMember, _super);
    function ProvableMember(json) {
        var _this = _super.call(this, json) || this;
        _this.fromJSON(json);
        return _this;
    }
    ProvableMember.prototype.fromJSON = function (json) {
        this.personUid = uid_js_1.UID.toField(json.personUid);
        this.communityUid = uid_js_1.UID.toField(json.communityUid);
        this.role = (0, snarkyjs_1.Field)(json.role);
    };
    ProvableMember.prototype.toJSON = function () {
        return {
            personUid: this.personUid.toString(),
            communityUid: this.communityUid.toString(),
            role: this.role.toString()
        };
    };
    ProvableMember.prototype.hash = function () {
        return this.role;
    };
    ProvableMember.prototype.key = function () {
        return snarkyjs_1.Poseidon.hash([this.communityUid, this.personUid]);
    };
    return ProvableMember;
}((0, snarkyjs_1.Struct)({
    personUid: snarkyjs_1.Field,
    communityUid: snarkyjs_1.Field,
    role: snarkyjs_1.Field /* 0-Not a member, 1-Plain member, 2-Validator, 3-Auditor */
})));
exports.ProvableMember = ProvableMember;
