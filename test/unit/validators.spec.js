import bitcoin from "bitcoinjs-lib";
import { exceptions } from "config";
import { validators } from "additional";
import { MIN_PASS_LENGTH, SIMNET_NETWORK, WALLET_NAME_MAX_LENGTH } from "config/consts";

describe("Validators Unit Tests", () => {
    const seed = [
        "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a",
        "a", "a",
    ];

    beforeEach(() => {
        window.ipcClient.reset();
    });

    describe("validateBitcoinAddr()", () => {
        it("should return null for simnet lncli p2wkh with simnet network", () => {
            const addr = "sb1qkk0f8qhfwtz534hvyuppdfjtufflcupygegrjx";
            const valid = validators.validateBitcoinAddr(addr, SIMNET_NETWORK);
            expect(valid).to.equal(null);
        });
        it("should return null for simnet lncli np2wkh with simnet network", () => {
            const addr = "rekbUqtgyAgznvAT1wB9jJuk1aZCd8JNNy";
            const valid = validators.validateBitcoinAddr(addr, SIMNET_NETWORK);
            expect(valid).to.equal(null);
        });
        it("should return null for simnet rpc p2wkh with simnet network", () => {
            const addr = "sb1q9n8lkey3tpcfx6gqfj6ja5cal9qj9je5ws99ak";
            const valid = validators.validateBitcoinAddr(addr, SIMNET_NETWORK);
            expect(valid).to.equal(null);
        });
        it("should return null for simnet rpc np2wkh with simnet network", () => {
            const addr = "rZ61jq3tiPGyZZMvC5o9DwEgWeCPTtKBwq";
            const valid = validators.validateBitcoinAddr(addr, SIMNET_NETWORK);
            expect(valid).to.equal(null);
        });
        it("should return error for simnet p2wkh with testnet network", () => {
            const addr = "rZ61jq3tiPGyZZMvC5o9DwEgWeCPTtKBwq";
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for simnet p2wkh with mainnet network", () => {
            const addr = "rZ61jq3tiPGyZZMvC5o9DwEgWeCPTtKBwq";
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.bitcoin);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return null for testnet address with testnet network", () => {
            const addr = "2N6tjLxVUg4JpJc2T1qTQ8AxZqgpZkgyJ8C";
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(null);
        });
        it("should return error for testnet address with simnet network", () => {
            const addr = "2N6tjLxVUg4JpJc2T1qTQ8AxZqgpZkgyJ8C";
            const valid = validators.validateBitcoinAddr(addr, SIMNET_NETWORK);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for testnet address with mainnet network", () => {
            const addr = "2N6tjLxVUg4JpJc2T1qTQ8AxZqgpZkgyJ8C";
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.bitcoin);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return null for mainnet address with mainnet network", () => {
            const addr = "1MHavQiH9sy4WZFSkQmuAChffMaeXocbGK";
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.bitcoin);
            expect(valid).to.equal(null);
        });
        it("should return error for mainnet address with simnet network", () => {
            const addr = "1MHavQiH9sy4WZFSkQmuAChffMaeXocbGK";
            const valid = validators.validateBitcoinAddr(addr, SIMNET_NETWORK);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for mainnet address with testnet network", () => {
            const addr = "1MHavQiH9sy4WZFSkQmuAChffMaeXocbGK";
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for lightningId with simnet network", () => {
            const addr = "03aa0d6ce4c02045e4dbc350fe0696937c898b4ed9c820a80c21a314a12ecf63ed";
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for lightningId with testnet network", () => {
            const addr = "03aa0d6ce4c02045e4dbc350fe0696937c898b4ed9c820a80c21a314a12ecf63ed";
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for lightningId with mainnet network", () => {
            const addr = "03aa0d6ce4c02045e4dbc350fe0696937c898b4ed9c820a80c21a314a12ecf63ed";
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for random string with simnet network", () => {
            const addr = "qwertyuu";
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for random string with testnet network", () => {
            const addr = "qwertyuu";
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for random string with mainnet network", () => {
            const addr = "qwertyuu";
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for empty string with simnet network", () => {
            const addr = "";
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for empty string with testnet network", () => {
            const addr = "";
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for empty string with mainnet network", () => {
            const addr = "";
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for null with simnet network", () => {
            const addr = null;
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for null with testnet network", () => {
            const addr = null;
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for null with mainnet network", () => {
            const addr = null;
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for false with simnet network", () => {
            const addr = false;
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for false with testnet network", () => {
            const addr = false;
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for false with mainnet network", () => {
            const addr = false;
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for true with simnet network", () => {
            const addr = true;
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for true with testnet network", () => {
            const addr = true;
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
        it("should return error for true with mainnet network", () => {
            const addr = true;
            const valid = validators.validateBitcoinAddr(addr, bitcoin.networks.testnet);
            expect(valid).to.equal(exceptions.BITCOIN_ADDRESS_WRONG);
        });
    });

    describe("validateChannelHost()", () => {
        it("should return null for valid channel host", () => {
            const host = "03aa0d6ce4c02045e4dbc350fe0696937c898b4ed9c820a80c21a314a12ecf63ed@127.0.0.1:9735";
            const valid = validators.validateChannelHost(host);
            expect(valid).to.equal(null);
        });
        it("should return error for empty host", () => {
            const valid = validators.validateChannelHost();
            expect(valid).to.equal(exceptions.FIELD_IS_REQUIRED);
        });
        it("should return error for invalid lightningId in host", () => {
            const valid = validators.validateChannelHost("12345@127.0.0.1:9735");
            expect(valid).to.equal(exceptions.LIGHTNING_ID_WRONG_LENGTH);
        });
        it("should return default error for invalid host", () => {
            const valid = validators.validateChannelHost("12345@");
            expect(valid).to.equal(exceptions.LIGHTNING_HOST_WRONG_FORMAT);
        });
    });

    describe("validateLightning", () => {
        it("should return null for valid length lightningId", () => {
            const lightningId = "03aa0d6ce4c02045e4dbc350fe0696937c898b4ed9c820a80c21a314a12ecf63ed";
            const valid = validators.validateLightning(lightningId);
            expect(valid).to.equal(null);
        });
        it("should return error for empty lightningId", () => {
            const valid = validators.validateLightning();
            expect(valid).to.equal(exceptions.FIELD_IS_REQUIRED);
        });
        it("should return error for invalid length lightningId", () => {
            const valid = validators.validateLightning("12345@127.0.0.1:9735");
            expect(valid).to.equal(exceptions.LIGHTNING_ID_WRONG_LENGTH);
        });
        it("should return error for invalid pattern", () => {
            const lightningId = "03aa0d6ce4c02045e4dbc350fe0696937c898b4ed9c820a80@21a314a12ecf63ed";
            const valid = validators.validateLightning(lightningId);
            expect(valid).to.equal(exceptions.LIGHTNING_ID_WRONG);
        });
    });

    describe("validatePass", () => {
        it("should return null for valid password", () => {
            const valid = validators.validatePass("1a2s3d4fQ");
            expect(valid).to.equal(null);
        });
        it("should return error for empty password", () => {
            const valid = validators.validatePass();
            expect(valid).to.equal(exceptions.FIELD_IS_REQUIRED);
        });
        it("should return error for short password", () => {
            const valid = validators.validatePass("1234");
            expect(valid).to.equal(exceptions.PASSWORD_WRONG_MIN_LENGTH);
        });
        it("should return error for incorrect chars in password", () => {
            const valid = validators.validatePass("<html>12345 678Qasd</html>");
            expect(valid).to.equal(exceptions.PASSWORD_WRONG_FORMAT);
        });
        it("should return error for password without uppercase chars", () => {
            const valid = validators.validatePass("1a1a1a1a1a");
            expect(valid).to.equal(exceptions.PASSWORD_WRONG_FORMAT);
        });
        it("should return error for password without lowercase chars", () => {
            const valid = validators.validatePass("1A1A1A1A1A");
            expect(valid).to.equal(exceptions.PASSWORD_WRONG_FORMAT);
        });
        it("should return error for password without numbers", () => {
            const valid = validators.validatePass("aaaaaaaaA");
            expect(valid).to.equal(exceptions.PASSWORD_WRONG_FORMAT);
        });
    });

    describe("validateName", () => {
        it("should return null for valid name", () => {
            const valid = validators.validateName("WalletName");
            expect(valid).to.equal(null);
        });
        it("should return null for valid required name", () => {
            const valid = validators.validateName("WalletName", true);
            expect(valid).to.equal(null);
        });
        it("should return null for valid required name without space", () => {
            const valid = validators.validateName("WalletName", true, false);
            expect(valid).to.equal(null);
        });
        it("should return null for valid required unicode name with space", () => {
            const valid = validators.validateName("久保田 利伸");
            expect(valid).to.equal(null);
        });
        it("should return null for valid required name with spaces and separators", () => {
            const valid = validators.validateName("WalletName: xxxx", true, true, undefined, undefined, true);
            expect(valid).to.equal(null);
        });
        it("should return error for unicode name", () => {
            const valid = validators.validateName("久保田 利伸", false, true, false);
            expect(valid).to.equal(exceptions.WALLET_NAME_WRONG_FORMAT());
        });
        it("should return error for all unicode characters name", () => {
            const valid = validators.validateName("%");
            expect(valid).to.equal(exceptions.WALLET_NAME_WRONG_FORMAT());
        });
        it("should return error for empty required name", () => {
            const valid = validators.validateName("", true);
            expect(valid).to.equal(exceptions.FIELD_IS_REQUIRED);
        });
        it("should return null for empty not required name", () => {
            const valid = validators.validateName("");
            expect(valid).to.equal(null);
        });
        it("should return error for extra long name, without setting length", () => {
            const name = "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq" +
                "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq" +
                "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";
            const valid = validators.validateName(name);
            expect(valid).to.equal(exceptions.WALLET_NAME_WRONG_MAX_LENGTH());
        });
    });

    describe("validatePassMismatch", () => {
        it("should return error for empty pass confirmation", () => {
            const valid = validators.validatePassMismatch("Password");
            expect(valid).to.equal(exceptions.FIELD_IS_REQUIRED);
        });
        it("should return error for mismatch pass", () => {
            const valid = validators.validatePassMismatch("Password", "Pass");
            expect(valid).to.equal(exceptions.PASSWORD_MISMATCH);
        });
        it("should return null for valid check", () => {
            const valid = validators.validatePassMismatch("Password", "Password");
            expect(valid).to.equal(null);
        });
    });

    describe("validatePassDiff", () => {
        it("should return error old password", () => {
            const valid = validators.validatePassDiff("Password", "Password");
            expect(valid).to.equal(exceptions.PASSWORD_DIFF);
        });
        it("should return null for valid check", () => {
            const valid = validators.validatePassDiff("Password", "Pass");
            expect(valid).to.equal(null);
        });
    });

    describe("validatePassSeed", () => {
        it("should return error for empty seed words field", () => {
            const valid = validators.validatePassSeed("");
            expect(valid).to.equal(exceptions.FIELD_IS_REQUIRED);
        });
        it("should return error for mismatch pass", () => {
            const valid = validators.validatePassSeed("Some old seed words", "Some awesome seed words");
            expect(valid).to.equal(exceptions.PASSWORD_SEED_MISMATCH);
        });
        it("should return null for valid check", () => {
            const valid = validators.validatePassSeed("Some awesome seed words", "Some awesome seed words");
            expect(valid).to.equal(null);
        });
    });

    describe("validateSeed", () => {
        it("should return error for empty seed words field", () => {
            const valid = validators.validateSeed([]);
            expect(valid).to.equal(exceptions.FIELD_IS_REQUIRED);
        });
        it("should return error for wrong seed words count", () => {
            const valid = validators.validateSeed(["1"]);
            expect(valid).to.equal(exceptions.PASSWORD_SEED_COUNT_MISMATCH);
        });
        it("should return error for seed with any char except [a-z]", () => {
            const errorSeed = seed.slice(0);
            errorSeed[0] = "1";
            const valid = validators.validateSeed(errorSeed);
            expect(valid).to.equal(exceptions.PASSWORD_SEED_WRONG_FORMAT);
        });
        it("should return null for valid check", () => {
            const valid = validators.validateSeed(seed);
            expect(valid).to.equal(null);
        });
    });

    describe("validateUserExistence", () => {
        beforeEach(() => {
            window.ipcClient
                .withArgs("checkWalletName")
                .returns({
                    ok: true,
                });
        });

        it("should return error for invalid name (required, w/o space, unicode)", async () => {
            const walletName = "@walletName";
            const valid = await validators.validateUserExistence(walletName);
            expect(valid).to.equal(exceptions.WALLET_NAME_WRONG_FORMAT(false));
            expect(window.ipcClient).not.to.be.called;
        });
        it("should return error if user exists", async () => {
            window.ipcClient
                .withArgs("checkWalletName")
                .returns({
                    ok: false,
                });
            const walletName = "walletName";
            const valid = await validators.validateUserExistence(walletName);
            expect(valid).to.equal(exceptions.WALLET_NAME_EXISTS);
            expect(window.ipcClient).to.be.calledOnce;
            expect(window.ipcClient).to.be.calledWith("checkWalletName", { walletName });
        });
        it("should return null for not existing user", async () => {
            const walletName = "walletName";
            const valid = await validators.validateUserExistence(walletName);
            expect(valid).to.equal(null);
            expect(window.ipcClient).to.be.calledOnce;
            expect(window.ipcClient).to.be.calledWith("checkWalletName", { walletName });
        });
    });

    describe("validateLndPath", () => {
        beforeEach(() => {
            window.ipcClient
                .withArgs("validateLndPath")
                .returns({
                    ok: false,
                });
        });

        it("should return error for undefined path", async () => {
            const valid = await validators.validateLndPath();
            expect(valid).to.equal(exceptions.FIELD_IS_REQUIRED);
        });
        it("should return error if some problem with folder", async () => {
            const dataPath = "/";
            const valid = await validators.validateLndPath(dataPath);
            expect(valid).to.equal(exceptions.FOLDER_UNAVAILABLE);
            expect(window.ipcClient).to.be.calledOnce;
            expect(window.ipcClient).to.be.calledWith("validateLndPath", { lndPath: dataPath });
        });
        it("should return null if all is good", async () => {
            window.ipcClient
                .withArgs("validateLndPath")
                .returns({
                    ok: true,
                });
            const dataPath = "/";
            const valid = await validators.validateLndPath(dataPath);
            expect(valid).to.equal(null);
            expect(window.ipcClient).to.be.calledOnce;
            expect(window.ipcClient).to.be.calledWith("validateLndPath", { lndPath: dataPath });
        });
    });
});
