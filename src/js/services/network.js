/**
 * NETWORK
 *
 * The network service is used to communicate with the Ripple network.
 *
 * It encapsulates a RippleAPI instance.
 */

var module = angular.module('network', []);

module.factory('rpNetwork', ['$rootScope', function($scope)
{
  /**
   * Manage network state.
   *
   * This class is intended to manage the connection status to the
   * Ripple network.
   *
   * Note that code in other places *is allowed* to call the Ripple
   * library directly. This is not to be intended to be an abstraction
   * layer on top of an abstraction layer.
   */
  var Network = function() {
    this.connected = false;
    this.api = new RippleAPI(Options.connection);
    this.remote = this.api;
  };

  Network.prototype.connect = async function(serverSettings) {
    serverSettings = serverSettings ? serverSettings : Options.connection;

    this.api = new RippleAPI(serverSettings);
    this.remote = this.api;
    this.api.on('connected', () => {
      console.log('connected');
      var self = this;
      self.connected = true;
      $scope.connected = true;
      $scope.$broadcast('$netConnected');

      if(!$scope.$$phase) {
        $scope.$apply()
      }
    });
    this.api.on('disconnected', (code) => {
      console.log('disconnected, code:', code);
      var self = this;
      self.connected = false;
      $scope.connected = false;
      $scope.$broadcast('$netDisconnected');

      if(!$scope.$$phase) {
        $scope.$apply()
      }
    });

    if (serverSettings && serverSettings.server) {
      await this.api.connect();
    }
  };

  Network.prototype.disconnect = async function() {
    if (this.connected) {
      await this.api.disconnect();
    }
  };

  /**
   * Setup listeners for identity state.
   *
   * This function causes the network object to start listening to
   * changes in the identity state and automatically subscribe to
   * accounts accordingly.
   */
  Network.prototype.listenId = function (id)
  {
    var self = this;
  };

  /* Milliseconds to wait between checks for a new ledger. */
  const INTERVAL = 1000;

  Network.prototype.submitTx = function (
      prepared, secret, onSuccess, onError, onSubmit) {
    return this.api.getLedger().then(ledger => {
      const signedData = this.api.sign(prepared.txJSON, secret);
      return this.api.submit(signedData.signedTransaction).then(data => {
        const submitResult = {
          engine_result: data.resultCode,
          engine_result_message: data.resultMessage
        };

        console.log('Transaction submit result:', submitResult);

        if (data.resultCode === 'tesSUCCESS') {
          if (onSubmit) onSubmit(submitResult);
        } else {
          if (onError) onError(submitResult);
        }

        const options = {
          minLedgerVersion: ledger.ledgerVersion,
          maxLedgerVersion: prepared.instructions.maxLedgerVersion
        };
        return new Promise((resolve, reject) => {
          setTimeout(() => this.verifyTx(signedData.id, options, submitResult,
              onSuccess, onError).then(resolve, reject), INTERVAL);
        });
      });
    });
  };

  /* Verify a transaction is in a validated XRP Ledger version */
  Network.prototype.verifyTx = function (hash, options, submitResult, onSuccess,
      onError) {
    return this.api.getTransaction(hash, options).then(data => {
      const verificationResult = {
        engine_result: data.outcome.result,
        engine_result_message: ''
      };

      console.log('Transaction verification result:', verificationResult);

      if (data.outcome.result === 'tesSUCCESS') {
        onSuccess(verificationResult);
      } else {
        onError(verificationResult);
      }
    }).catch(error => {
      /* If transaction not in latest validated ledger,
         try again until max ledger hit */
      if (error instanceof this.api.errors.PendingLedgerVersionError) {
        return new Promise((resolve, reject) => {
          setTimeout(() => this.verifyTx(hash, options, submitResult,
             onSuccess, onError).then(resolve, reject), INTERVAL);
        });
      }

      console.warn(error);

      /* if submit succeeded or the error is not ledger NotFoundError,
         notify caller with onError callback. */
      if (submitResult.engine_result === 'tesSUCCESS' || !(
            error instanceof this.api.errors.NotFoundError &&
            error.message === 'ledger_index and LedgerSequence not found in tx')
      ) {
        onError({
          engine_result: '',
          engine_result_message: 'Transaction not verified: ' + error.message
        });
      }
    });
  }

  return new Network();
}]);

