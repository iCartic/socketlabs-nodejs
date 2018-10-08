'use strict';

const addressResult = require('./addressResult');
const sendResultEnum = require('./sendResultEnum');
const toAddressResult = require('./helpers/toAddressResult')

class SendResponse {

        /**
     * Creates a new instance of the SendResponse class.
     * @constructor
     * @param {sendResultEnum} sendResult
     * @param {string} transactionReceipt
     * @param {addressResult[]} addressResults
     * @param {string} responseMessage
     */
    constructor( {
        result = null,
        transactionReceipt = null,
        addressResults = null,
        responseMessage = null
    } = {}) {
            
        this.transactionReceipt = null;
        this.addressResults = null;
        
        if (result){
            this.setResult(result)
        }
        if (transactionReceipt){
            this.setTransactionReceipt(transactionReceipt);
        }
        if (addressResults){
            this.setAddressResults(sendResult);
        }
        if (responseMessage){
            this.setResponseMessage(responseMessage);
        }

    }

    /**
     * Set the result of the SocketLabsClient send request. 
     * @param  {sendResultEnum} value
     */
    setResult(value) {
        var sr;
        if (typeof value === 'undefined' || !value) {
          return;
        }
        else if ((typeof value === 'object') && 
            ('name' in value)  &&
            ('value' in value) &&
            ('message' in value) ){
                /**
                 * The result of the SocketLabsClient send request. 
                 */
                this.result = value;
                this.responseMessage = value.message; 
        }
        else {
            throw new Error("Invalid sendResult, type of 'sendResultEnum' was expected.");
        }
    }

    /**
     * Set the unique key generated by the Injection API if an unexpected error occurs during the SocketLabsClient send request.
     * @param  {string} value
     */
    setTransactionReceipt(value) {
        if (typeof value === 'undefined' || !value) {
          return;
        }
        if (typeof value !== 'string') {
          throw new Error("Invalid transactionReceipt, type of 'string' was expected.");
        }    
        /**
        * A unique key generated by the Injection API if an unexpected error occurs during the SocketLabsClient send request.
        * This unique key can be used by SocketLabs support to troubleshoot the issue.
        */
        this.transactionReceipt = value;
    }
    
    /**
     * Set the array of AddressResult objects.
     * @param  {addressResult} value
     */
    setAddressResults(value) {        
        if (typeof value === 'undefined' || !value) {
          return;
        }        
        if (!this.addressResults || this.addressResults === undefined) {
            /**
             * An array of AddressResult objects that contain the status of each address that failed. If no messages failed this array is empty.
             */
            this.addressResults = [];
        }
        if(value && Array.isArray(value)) {
            value.forEach(element => {
                this.addressResults.push(toAddressResult.convert(element));
            });            
        }
        else {
            this.addressResults.push(toAddressResult.convert(value));
        }                    
    }
    
    /**
     * Set A message detailing why the SocketLabsClient send request failed.
     * @param  {string} value
     */
    setResponseMessage(value) {   
        if (typeof value === 'undefined' || !value) {
          return;
        }
        if (typeof value !== 'string') {
          throw new Error("Invalid responseMessage, type of 'string' was expected.");
        }
        /**
         * A message detailing why the SocketLabsClient send request failed.
         */
        this.responseMessage = value;    
    }
    

    toString() {
        return `${this.sendResult}: ${this.responseMessage}`;
    }

    /**
     * Parse the response from theInjection Api into SendResponse
     * @param {object} value - The HttpResponseMessage from the Injection Api
     * @returns {sendResponse} A sendResponse from the Injection Api response
     */
    static parse(value){

        var body = value.body;
        var response = new SendResponse({ transactionReceipt: body.TransactionReceipt });

        switch (value.statusCode)
        {
            case 200: //HttpStatusCode.OK
                var r = sendResultEnum[body.ErrorCode];
                if (r === undefined) {                
                    response.setResult(sendResultEnum.UnknownError);
                }
                else {
                    response.setResult(r);
                }
                break;

            case 500: //HttpStatusCode.InternalServerError
                response.setResult(sendResultEnum.InternalError);
                break;

            case 408: //HttpStatusCode.RequestTimeout
                response.setResult(sendResultEnum.Timeout);
                break;

            case 401: //HttpStatusCode.Unauthorized
                response.setResult(sendResultEnum.InvalidAuthentication);
                break;

            default:
                response.setResult(sendResultEnum.UnknownError);
                break;
        }
        
        if (response.result == sendResultEnum.Warning && (body.MessageResults && body.MessageResults.length > 0))
        {
            var r = sendResultEnum[body.MessageResults[0].ErrorCode];
            if (r !== undefined) {                
                response.setResult(r);
            }
        }
                
        if (body.MessageResults && body.MessageResults.length > 0) {
            response.setAddressResults(body.MessageResults[0].AddressResults);
        }

        return response;
        
    }
}

module.exports = SendResponse;