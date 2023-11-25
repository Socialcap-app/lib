"use strict";
exports.__esModule = true;
exports.EntityState = void 0;
/*
const CommunityState = () => new _State_(COMMUNITY_STATES);

const PersonState = () => new _State_(PERSON_STATES);

const ClaimState = () => new _State_(CLAIM_STATES);


const COMMUNITY_STATES = [
  "", "REVISION", "APPROVED", "PAYMENT", "ACTIVE",
  "DELETED","CANCELED","PAUSED"
];

const PERSON_STATES = [
  "", "REVISION", "APPROVED", "PAYMENT", "ACTIVE",
  "DELETED","CANCELED","PAUSED"
];

const CLAIM_STATES = [
  "", "REVISION", "APPROVED", "PAYMENT", "ACTIVE",
  "DELETED","CANCELED","PAUSED"
];
*/
var EntityState = /** @class */ (function () {
    function EntityState(valids, transitions) {
        this.valids = valids;
        this.transitions = transitions || null;
        this.current = "";
    }
    EntityState.prototype.set = function (value) {
        var val = (typeof (value) === 'number') ? this.valids[value] : value;
        if (!this.valids.includes(val))
            return this;
        if (!this.isValidTransition(val))
            return this;
        this.current = val;
        return this;
    };
    EntityState.prototype.initial = function () {
        return this.valids[0];
    };
    EntityState.prototype.get = function () {
        return this.current;
    };
    EntityState.prototype.index = function (value) {
        value = value || this.current;
        for (var j = 0; j < this.valids.length; j++) {
            if (this.valids[j] === value)
                return j;
        }
        return -1;
    };
    EntityState.prototype.isValidTransition = function (value) {
        if (!this.transitions)
            return true;
        return this.transitions[this.current].includes(value);
    };
    // experimental
    EntityState.prototype.changeFrom = function (from0, to1) {
        if (!this.valids.includes(from0))
            return this.initial();
        if (!this.valids.includes(to1))
            return from0;
        this.set(from0).set(to1);
        return this.get();
    };
    return EntityState;
}());
exports.EntityState = EntityState;
