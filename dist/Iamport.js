"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var iamport_error_1 = require("./iamport-error");
var Promise = require("bluebird");
var axios_1 = require("axios");
var HTTP_OK = 200;
var HTTP_BAD_REQUEST = 400;
var HTTP_UNAUTHORIZED = 401;
var HTTP_NOT_FOUND = 404;
var Iamport = /** @class */ (function () {
    /**
     * Create an instance of Iamporter
     *
     * @param {string} [apiKey]
     * @param {string} [secret]
     * @param {string} [host]
     */
    function Iamport(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.apiKey, apiKey = _c === void 0 ? 'imp_apiKey' : _c, _d = _b.secret, secret = _d === void 0 ? 'ekKoeW8RyKuT0zgaZsUtXXTLQ4AhPFW3ZGseDA6bkA5lamv9OqDMnxyeB9wqOsuO9W3Mx9YSJ4dTqJ3f' : _d, _e = _b.host, host = _e === void 0 ? 'https://api.iamport.kr' : _e;
        this.apiKey = apiKey;
        this.secret = secret;
        this.host = host;
        this.client = axios_1.default.create({
            baseURL: this.host,
            responseType: 'json',
            timeout: 1000 * 30
        });
    }
    Iamport.prototype._request = function (spec) {
        var _this = this;
        spec.headers = {
            'User-Agent': 'Iamporter.js'
        };
        if (!this.isExpiredToken())
            spec.headers['Authorization'] = this.token;
        return new Promise(function (resolve, reject) {
            _this.client.request(spec)
                .then(function (res) {
                var status = res.status, data = res.data;
                var output = _this.resSerializer(res);
                if (data.code !== 0)
                    return reject(new iamport_error_1.IamportError(data.message, output));
                else
                    return resolve(output);
            })
                .catch(function (err) {
                if (!err.response)
                    return reject(new iamport_error_1.IamportError('예기치 못한 오류가 발생하였습니다.', {}));
                var _a = err.response, status = _a.status, data = _a.data;
                var output = _this.resSerializer(err.response);
                switch (status) {
                    case HTTP_OK:
                    case HTTP_BAD_REQUEST:
                        return reject(new iamport_error_1.IamportError(data.message, output));
                    case HTTP_UNAUTHORIZED:
                        return reject(new iamport_error_1.IamportError('아임포트 API 인증에 실패하였습니다.', output));
                    case HTTP_NOT_FOUND:
                        return resolve(output);
                    default:
                        return reject(new iamport_error_1.IamportError('예기치 못한 오류가 발생하였습니다.', output));
                }
            });
        });
    };
    Iamport.prototype._updateToken = function () {
        var _this = this;
        if (this.isExpiredToken()) {
            return this.getToken()
                .then(function (res) {
                _this.token = res.data['access_token'];
                _this.expireAt = res.data['expired_at'];
                return _this.token;
            });
        }
        else {
            return Promise.resolve(this.token);
        }
    };
    Iamport.prototype._validatePayment = function (amount, res) {
        if (res.data.status !== 'paid' || res.data.amount !== amount)
            throw new iamport_error_1.IamportError('Fail to validate payment', res.data['fail_reason']);
        return res;
    };
    Iamport.prototype.isExpiredToken = function () {
        return !this.expireAt || Number(this.expireAt) <= Math.floor(Date.now() / 1000);
    };
    /**
     * API 토큰 요청
     * GET - https://api.iamport.kr/users/getToken
     * @see {@link https://api.iamport.kr/#!/authenticate/getToken}
     *
     * @param {string} [apiKey=this.apiKey]
     * @param {string} [secret=this.secret]
     * @returns {Promise} result
     */
    Iamport.prototype.getToken = function (apiKey, secret) {
        if (apiKey === void 0) { apiKey = this.apiKey; }
        if (secret === void 0) { secret = this.secret; }
        var spec = {
            method: 'POST',
            url: '/users/getToken',
            data: {
                'imp_key': apiKey,
                'imp_secret': secret
            }
        };
        return this._request(spec);
    };
    /**
     * SMS 본인인증 정보 조회
     * GET - https://api.iamport.kr/certifications/{imp_uid}
     * @see {@link https://api.iamport.kr/#!/certifications/getCertification}
     *
     * @param {string} impUid
     * @returns {Promise} result
     */
    Iamport.prototype.getCertification = function (impUid) {
        var _this = this;
        var spec = {
            method: 'GET',
            url: "/certifications/" + impUid
        };
        return this._updateToken()
            .then(function () { return _this._request(spec); });
    };
    /**
     * SMS 본인인증 정보 삭제
     * DELETE - https://api.iamport.kr/certifications/{imp_uid}
     * @see {@link https://api.iamport.kr/#!/certifications/deleteCertification}
     *
     * @returns {Promise} result
     */
    Iamport.prototype.deleteCertification = function (impUid) {
        var _this = this;
        var spec = {
            method: 'DELETE',
            url: "/certifications/" + impUid
        };
        return this._updateToken()
            .then(function () { return _this._request(spec); });
    };
    /**
     * 에스크로 결제 배송정보 등록
     * POST - https://api.iamport.kr/escrows/logis/{imp_uid}
     * @see {@link https://api.iamport.kr/#!/escrow.logis/escrow_logis_save}
     *
     * @returns {Promise} result
     */
    /**
     * 아임포트 고유 아이디로 결제 정보 조회
     * GET - https://api.iamport.kr/payments/{imp_uid}
     * @see {@link https://api.iamport.kr/#!/payments/getPaymentByImpUid}
     *
     * @param {string} impUid
     * @returns {Promise} result
     */
    Iamport.prototype.findByImpUid = function (impUid) {
        var _this = this;
        var spec = {
            method: 'GET',
            url: "/payments/" + impUid
        };
        return this._updateToken()
            .then(function () { return _this._request(spec); });
    };
    /**
     * 상점 고유 아이디로 결제 정보 조회
     * GET - https://api.iamport.kr/payments/find/{merchant_uid}
     * @see {@link https://api.iamport.kr/#!/payments/getPaymentByMerchantUid}
     *
     * @param {string} merchantUid
     * @returns {Promise} result
     */
    Iamport.prototype.findByMerchantUid = function (merchantUid) {
        var _this = this;
        var spec = {
            method: 'GET',
            url: "/payments/find/" + merchantUid
        };
        return this._updateToken()
            .then(function () { return _this._request(spec); });
    };
    /**
     * 상점 고유 아이디로 결제 정보 목록 조회
     * GET - https://api.iamport.kr/payments/findAll/{merchant_uid}/{payment_status}
     * @see {@link https://api.iamport.kr/#!/payments/getAllPaymentsByMerchantUid}
     *
     * @param {string} merchantUid
     * @param {Object} [extra]
     * @param {string} [extra.status]
     * @returns {Promise} result
     */
    Iamport.prototype.findAllByMerchantUid = function (merchantUid, extra) {
        var _this = this;
        if (extra === void 0) { extra = {
            status: ''
        }; }
        var spec = {
            method: 'GET',
            url: "/payments/findAll/" + merchantUid + "/" + extra.status
        };
        return this._updateToken()
            .then(function () { return _this._request(spec); });
    };
    /**
     * 결제 상태로 결제 정보 목록 조회
     * GET - https://api.iamport.kr/payments/status/{payment_status}
     * @see {@link https://api.iamport.kr/#!/payments/getPaymentsByStatus}
     *
     * @param {string} [status=all]
     * @param {Object} [extra]
     * @param {} extra.page
     * @param {} extra.from
     * @param {} extra.to
     * @returns {Promise} result
     */
    Iamport.prototype.findAllByStatus = function (status, extra) {
        var _this = this;
        if (status === void 0) { status = 'all'; }
        if (extra === void 0) { extra = {}; }
        var spec = {
            method: 'GET',
            url: "/payments/status/" + status,
            params: extra
        };
        return this._updateToken()
            .then(function () { return _this._request(spec); });
    };
    /**
     * 결제취소
     * POST - https://api.iamport.kr/payments/cancel
     * @see {@link https://api.iamport.kr/#!/payments/cancelPayment}
     *
     * @param {Object} [data={}]
     * @returns {Promise} result
     */
    Iamport.prototype.cancel = function (data) {
        var _this = this;
        if (data === void 0) { data = {}; }
        var spec = {
            method: 'POST',
            url: '/payments/cancel',
            data: data
        };
        return this._updateToken()
            .then(function () { return _this._request(spec); });
    };
    /**
     * 아임포트 고유 아이디로 결제취소
     * POST - https://api.iamport.kr/payments/cancel
     * @see {@link https://api.iamport.kr/#!/payments/cancelPayment}
     *
     * @param {string} impUid
     * @param {Object} [extra={}]
     * @returns {Promise} result
     */
    Iamport.prototype.cancelByImpUid = function (impUid, extra) {
        if (extra === void 0) { extra = {}; }
        var data = Object.assign(extra, { 'imp_uid': impUid });
        return this.cancel(data);
    };
    /**
     * 상점 고유 아이디로 결제취소
     * POST - https://api.iamport.kr/payments/cancel
     * @see {@link https://api.iamport.kr/#!/payments/cancelPayment}
     *
     * @param {string} merchantUid
     * @param {Object} [extra={}]
     * @returns {Promise} result
     */
    Iamport.prototype.cancelByMerchantUid = function (merchantUid, extra) {
        if (extra === void 0) { extra = {}; }
        var data = Object.assign(extra, { 'merchant_uid': merchantUid });
        return this.cancel(data);
    };
    /**
     * 결제예정금액 사전등록
     * POST - https://api.iamport.kr/payments/prepare
     * @see {@link https://api.iamport.kr/#!/payments.validation/preparePayment}
     *
     * @param {Object} data
     * @returns {Promise} result
     */
    Iamport.prototype.createPreparedPayment = function (data) {
        var _this = this;
        if (data === void 0) { data = {}; }
        var requiredParams = ['merchant_uid', 'amount'];
        if (!requiredParams.every(function (param) { return data.hasOwnProperty(param); }))
            return Promise.reject(new iamport_error_1.IamportError('파라미터 누락: ', requiredParams));
        var spec = {
            method: 'POST',
            url: '/payments/prepare',
            data: data
        };
        return this._updateToken()
            .then(function () { return _this._request(spec); });
    };
    /**
     * 사전등록된 결제정보 조회
     * GET - https://api.iamport.kr/payments/prepare/{merchant_uid}
     * @see {@link https://api.iamport.kr/#!/payments.validation/getPaymentPrepareByMerchantUid}
     *
     * @param {string} merchantUid
     * @returns {Promise} result
     */
    Iamport.prototype.getPreparedPayment = function (merchantUid) {
        var _this = this;
        var spec = {
            method: 'GET',
            url: "/payments/prepare/" + merchantUid
        };
        return this._updateToken()
            .then(function () { return _this._request(spec); });
    };
    /**
     * 비인증 신용카드 결제요청
     * POST - https://api.iamport.kr/subscribe/payments/onetime
     * @see {@link https://api.iamport.kr/#!/subscribe/onetime}
     *
     * @param {Object} data
     * @returns {Promise} result
     */
    Iamport.prototype.payOnetime = function (data) {
        var _this = this;
        var requiredParams = [
            'merchant_uid', 'amount', 'card_number', 'expiry',
            'birth'
        ];
        if (!requiredParams.every(function (param) { return data.hasOwnProperty(param); }))
            return Promise.reject(new iamport_error_1.IamportError('파라미터 누락: ', requiredParams));
        var spec = {
            method: 'POST',
            url: '/subscribe/payments/onetime',
            data: data
        };
        return this._updateToken()
            .then(function () { return _this._request(spec); })
            .then(function (res) { return _this._validatePayment(data.amount, res); });
    };
    /**
     * 비인증 빌링키 결제요청
     * POST - https://api.iamport.kr/subscribe/payments/again
     * @see {@link https://api.iamport.kr/#!/subscribe/again}
     *
     * @param {Object} data
     * @returns {Promise} result
     */
    Iamport.prototype.paySubscription = function (data) {
        var _this = this;
        var requiredParams = [
            'customer_uid', 'merchant_uid', 'amount'
        ];
        if (!requiredParams.every(function (param) { return data.hasOwnProperty(param); }))
            return Promise.reject(new iamport_error_1.IamportError('파라미터 누락: ', requiredParams));
        var spec = {
            method: 'POST',
            url: '/subscribe/payments/again',
            data: data
        };
        return this._updateToken()
            .then(function () { return _this._request(spec); })
            .then(function (res) { return _this._validatePayment(data.amount, res); });
    };
    /**
     * 해외카드 결제요청
     * POST - https://api.iamport.kr/subscribe/payments/foreign
     *
     * @param {Object} data
     * @returns {Promise} result
     */
    Iamport.prototype.payForeign = function (data) {
        var _this = this;
        var requiredParams = [
            'merchant_uid', 'amount', 'card_number', 'expiry'
        ];
        if (!requiredParams.every(function (param) { return data.hasOwnProperty(param); }))
            return Promise.reject(new iamport_error_1.IamportError('파라미터 누락: ', requiredParams));
        var spec = {
            method: 'POST',
            url: '/subscribe/payments/foreign',
            data: data
        };
        return this._updateToken()
            .then(function () { return _this._request(spec); })
            .then(function (res) { return _this._validatePayment(data.amount, res); });
    };
    /**
     * POST - https://api.iamport.kr/subscribe/payments/schedule
     * @see {@link https://api.iamport.kr/#!/subscribe/schedule}
     *
     * @returns {Promise} result
     */
    /**
     * POST - https://api.iamport.kr/subscribe/payments/unschedule
     * @see {@link https://api.iamport.kr/#!/subscribe/unschedule}
     *
     * @returns {Promise} result
     */
    /**
     * 구매자 빌링키 발급
     * POST - https://api.iamport.kr/subscribe/customers/{customer_uid}
     * @see {@link https://api.iamport.kr/#!/subscribe.customer/customer_save}
     *
     * @param {Object} data
     * @returns {Promise} result
     */
    Iamport.prototype.createSubscription = function (data) {
        var _this = this;
        if (data === void 0) { data = {}; }
        var requiredParams = [
            'customer_uid', 'card_number', 'expiry', 'birth',
        ];
        if (!requiredParams.every(function (param) { return data.hasOwnProperty(param); }))
            return Promise.reject(new iamport_error_1.IamportError('파라미터 누락: ', requiredParams));
        var spec = {
            method: 'POST',
            url: "/subscribe/customers/" + data['customer_uid'],
            data: data
        };
        return this._updateToken()
            .then(function () { return _this._request(spec); });
    };
    /**
     * 구매자 빌링키 조회
     * GET - https://api.iamport.kr/subscribe/customers/{customer_uid}
     * @see {@link https://api.iamport.kr/#!/subscribe.customer/customer_view}
     *
     * @param {string} customerUid
     * @returns {Promise} result
     */
    Iamport.prototype.getSubscription = function (customerUid) {
        var _this = this;
        var spec = {
            method: 'GET',
            url: "/subscribe/customers/" + customerUid
        };
        return this._updateToken()
            .then(function () { return _this._request(spec); });
    };
    /**
     * 구매자 빌링키 삭제
     * DELETE - https://api.iamport.kr/subscribe/customers/{customer_uid}
     * @see {@link https://api.iamport.kr/#!/subscribe.customer/customer_delete}
     *
     * @param {string} customerUid
     * @returns {Promise} result
     */
    Iamport.prototype.deleteSubscription = function (customerUid) {
        var _this = this;
        var spec = {
            method: 'DELETE',
            url: "/subscribe/customers/" + customerUid
        };
        return this._updateToken()
            .then(function () { return _this._request(spec); });
    };
    /**
     * 가상계좌 발급
     * POST - https://api.iamport.kr/vbanks
     * @see {@link https://api.iamport.kr/#!/vbanks/createVbank}
     *
     * @param {Object} data
     * @returns {Promise} result
     */
    Iamport.prototype.createVbank = function (data) {
        var _this = this;
        if (data === void 0) { data = {}; }
        var requiredParams = [
            'merchant_uid', 'amount', 'vbank_code', 'vbank_due', 'vbank_holder'
        ];
        if (!requiredParams.every(function (param) { return data.hasOwnProperty(param); }))
            return Promise.reject(new iamport_error_1.IamportError('파라미터 누락:', requiredParams));
        var spec = {
            method: 'POST',
            url: '/vbanks',
            data: data
        };
        return this._updateToken()
            .then(function () { return _this._request(spec); });
    };
    Iamport.prototype.resSerializer = function (res) {
        return {
            status: res.status,
            message: res.data.message,
            data: res.data.response,
            raw: res.data
        };
    };
    return Iamport;
}());
exports.Iamport = Iamport;
