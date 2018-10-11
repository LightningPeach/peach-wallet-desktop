import * as statusCodes from "config/status-codes";
import { helpers } from "additional";

describe("Helpers Unit Tests", () => {
    describe("formatDate()", () => {
        const time = 1523451007788; // 2018-04-11T12:50:07.788Z
        const date = new Date(time);
        const hours = date.getHours();

        it("should return default format", () => {
            const valid = helpers.formatDate(date);
            expect(valid).to.equal(`11.04.18 ${hours}:50:07`);
        });
        it("should return defined format", () => {
            const valid = helpers.formatDate(date, "%y-%m-%d!%h/%i/%s");
            expect(valid).to.equal(`18-04-11!${hours}/50/07`);
        });
        it("should return default format without lead zero", () => {
            const valid = helpers.formatDate(date, null, false);
            expect(valid).to.equal(`11.4.18 ${hours}:50:7`);
        });
        it("should return error if wrong date passed", () => {
            expect(() => helpers.formatDate(34, null, false)).to.throw(statusCodes.EXCEPTION_DATE_INSTANCE);
        });
    });

    describe("noExponents", () => {
        it("should return 1e-7 without exponent", () => {
            const valid = helpers.noExponents(1e-7);
            expect(valid).to.equal("0.0000001");
        });
        it("should return 1e7 without exponent", () => {
            const valid = helpers.noExponents(1e7);
            expect(valid).to.be.equal("10000000");
        });
        it("should return -0.1e25 without exponent", () => {
            const valid = helpers.noExponents(-0.1e25);
            expect(valid).to.be.equal("-1000000000000000000000000");
        });
        it("should return 0.1e-25 without exponent", () => {
            const valid = helpers.noExponents(0.1e-25);
            expect(valid).to.be.equal("0.00000000000000000000000001");
        });
        it("should return 0.1234567e7 without exponent", () => {
            const valid = helpers.noExponents(0.1234567e4);
            expect(valid).to.be.equal("1234.567");
        });
        it("should return -1", () => {
            const valid = helpers.noExponents(-1);
            expect(valid).to.be.equal("-1");
        });
        it("should return -1.01", () => {
            const valid = helpers.noExponents(-1.01);
            expect(valid).to.be.equal("-1.01");
        });
        it("should return -0.01", () => {
            const valid = helpers.noExponents(-0.01);
            expect(valid).to.be.equal("-0.01");
        });
        it("should return 2", () => {
            const valid = helpers.noExponents(2);
            expect(valid).to.be.equal("2");
        });
        it("should return 2.01", () => {
            const valid = helpers.noExponents(2.01);
            expect(valid).to.be.equal("2.01");
        });
        it("should return 2.01", () => {
            const valid = helpers.noExponents(2.01);
            expect(valid).to.be.equal("2.01");
        });
        it("should return \"qw\" string instead of \"qwerty\"", () => {
            const valid = helpers.noExponents("qwerty");
            expect(valid).to.equal("qw");
        });
        it("should return \"asdasd\" string", () => {
            const valid = helpers.noExponents("asdasd");
            expect(valid).to.equal("asdasd");
        });
    });

    describe("formatTimeRange", () => {
        it("should return null for incorrect number (1000 is not divider)", () => {
            expect(helpers.formatTimeRange(999)).to.equal(null);
        });

        it("should return correct for one count of measure", () => {
            expect(helpers.formatTimeRange(1000 * 3600 * 24)).to.equal("1 day");
        });

        it("should return correct for multiple count of measure", () => {
            expect(helpers.formatTimeRange(1000 * 2600 * 24)).to.equal("1040 minutes");
        });
    });
});
