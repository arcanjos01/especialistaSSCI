(function installCorrelationConfigurationCore_(global) {
  'use strict';

  const CONFIGURATION_AUTH_ = new WeakMap();
  const weakMapSet_ = WeakMap.prototype.set;
  const weakMapGet_ = WeakMap.prototype.get;
  const apply_ = Reflect.apply;
  const freeze_ = Object.freeze;
  const hasOwn_ = Object.prototype.hasOwnProperty;
  const keys_ = Object.keys;
  const names_ = Object.getOwnPropertyNames;
  const symbols_ = Object.getOwnPropertySymbols;
  const descriptor_ = Object.getOwnPropertyDescriptor;
  const getPrototype_ = Object.getPrototypeOf;
  const create_ = Object.create;
  const define_ = Object.defineProperty;
  const jsonParse_ = JSON.parse;
  const jsonStringify_ = JSON.stringify;
  const arrayIsArray_ = Array.isArray;
  const arrayPush_ = Array.prototype.push;
  const arraySort_ = Array.prototype.sort;
  const arrayIncludes_ = Array.prototype.includes;
  const stringCharCodeAt_ = String.prototype.charCodeAt;
  const utility_ = global.Utilities;
  const hmac_ = utility_ && utility_.computeHmacSha256Signature;
  const base64_ = utility_ && utility_.base64Encode;
  const propertiesService_ = global.PropertiesService;
  const getScriptProperties_ = propertiesService_ && propertiesService_.getScriptProperties;
  const CONFIGURATION_PROPERTY_ = 'SSCI_CORRELATION_CONFIGURATION_V1';
  const SIGNATURE_PROPERTY_ = 'SSCI_CORRELATION_CONFIGURATION_HMAC_SHA256';
  const KEY_PROPERTY_ = 'SSCI_CORRELATION_CONFIGURATION_HMAC_KEY';
  const CALIBRATION_AUTHORITY_KEY_PROPERTY_ = 'SSCI_CORRELATION_CALIBRATION_AUTHORITY_HMAC_KEY';

  function hasOwnData_(value, key) {
    const property = descriptor_(value, key);
    return !!property && apply_(hasOwn_, property, ['value']);
  }

  function hasExactKeys_(value, expected) {
    if (!value || typeof value !== 'object' || arrayIsArray_(value) ||
        getPrototype_(value) !== Object.prototype || symbols_(value).length) return false;
    const ownKeys = keys_(value);
    if (names_(value).length !== ownKeys.length || ownKeys.length !== expected.length) return false;
    for (let index = 0; index < ownKeys.length; index += 1) {
      if (!apply_(arrayIncludes_, expected, [ownKeys[index]]) || !hasOwnData_(value, ownKeys[index])) return false;
    }
    return true;
  }

  function freezeJson_(value) {
    if (!value || typeof value !== 'object') return value;
    if (arrayIsArray_(value)) {
      if (names_(value).length !== value.length + 1 || symbols_(value).length ||
          !hasOwnData_(value, 'length')) {
        throw new Error('invalid correlation configuration data');
      }
      const copy = [];
      for (let index = 0; index < value.length; index += 1) apply_(arrayPush_, copy, [freezeJson_(value[index])]);
      return freeze_(copy);
    }
    if (getPrototype_(value) !== Object.prototype || symbols_(value).length) {
      throw new Error('invalid correlation configuration data');
    }
    const copy = create_(null);
    const ownKeys = apply_(arraySort_, keys_(value), []);
    for (let index = 0; index < ownKeys.length; index += 1) {
      const key = ownKeys[index];
      if (key === '__proto__' || key === 'constructor' || key === 'prototype' || !hasOwnData_(value, key)) {
        throw new Error('invalid correlation configuration data');
      }
      define_(copy, key, {
        value: freezeJson_(value[key]), enumerable: true, writable: false, configurable: false
      });
    }
    return freeze_(copy);
  }

  function hmacBase64_(raw, key) {
    if (typeof hmac_ !== 'function' || typeof base64_ !== 'function') return null;
    return apply_(base64_, utility_, [apply_(hmac_, utility_, [raw, key])]);
  }

  function verifyCorrelationAssessment_(payload, signature) {
    try {
      if (typeof payload !== 'string' || typeof signature !== 'string' || !signature ||
          !propertiesService_ || typeof getScriptProperties_ !== 'function') return false;
      const properties = apply_(getScriptProperties_, propertiesService_, []);
      if (!properties || typeof properties.getProperty !== 'function') return false;
      const getProperty = properties.getProperty;
      const key = apply_(getProperty, properties, [KEY_PROPERTY_]);
      if (!isCanonicalHmacKey_(key)) return false;
      const expected = hmacBase64_(payload, key);
      return !!expected && sameStringConstantTime_(expected, signature);
    } catch (error) {
      return false;
    }
  }

  function verifyEmpiricalCalibration_(calibration) {
    try {
      if (!calibration || typeof calibration !== 'object' || !propertiesService_ ||
          typeof getScriptProperties_ !== 'function') return false;
      const properties = apply_(getScriptProperties_, propertiesService_, []);
      if (!properties || typeof properties.getProperty !== 'function') return false;
      const getProperty = properties.getProperty;
      const configurationKey = apply_(getProperty, properties, [KEY_PROPERTY_]);
      const key = apply_(getProperty, properties, [CALIBRATION_AUTHORITY_KEY_PROPERTY_]);
      if (!isCanonicalHmacKey_(configurationKey) || !isCanonicalHmacKey_(key) ||
          key === configurationKey || !hasOwnData_(calibration, 'validationSignature') ||
          typeof calibration.validationSignature !== 'string' ||
          !calibration.validationSignature) return false;
      const payload = serializeCalibrationReceipt_(calibration);
      if (payload === null) return false;
      const expected = hmacBase64_(payload, key);
      return !!expected && sameStringConstantTime_(expected, calibration.validationSignature);
    } catch (error) {
      return false;
    }
  }

  function isCanonicalHmacKey_(key) {
    if (typeof key !== 'string' || key.length !== 43) return false;
    for (let index = 0; index < key.length; index += 1) {
      const code = apply_(stringCharCodeAt_, key, [index]);
      const alphaNumeric = (code >= 65 && code <= 90) || (code >= 97 && code <= 122) ||
        (code >= 48 && code <= 57);
      if (!alphaNumeric && code !== 45 && code !== 95) return false;
    }
    const last = apply_(stringCharCodeAt_, key, [42]);
    const canonicalLastCharacters = 'AEIMQUYcgkosw048';
    for (let index = 0; index < canonicalLastCharacters.length; index += 1) {
      if (last === apply_(stringCharCodeAt_, canonicalLastCharacters, [index])) return true;
    }
    return false;
  }

  function serializeCalibrationReceipt_(calibration) {
    const fieldNames = [
      'calibrationId', 'version', 'baseId', 'bindingType', 'policyDigest', 'datasetHash',
      'validationEvidenceDigest', 'validationRecordId', 'validationStatus',
      'conflictDetectorId', 'conflictDetectorVersion'
    ];
    const payload = create_(null);
    define_(payload, 'schemaVersion', { value: '1.0.0', enumerable: true });
    for (let index = 0; index < fieldNames.length; index += 1) {
      const field = fieldNames[index];
      if (!hasOwnData_(calibration, field) || typeof calibration[field] !== 'string' || !calibration[field]) {
        return null;
      }
      define_(payload, field, { value: calibration[field], enumerable: true });
    }
    if (calibration.validationStatus !== 'EMPIRICALLY_VALIDATED' ||
        !isSha256HexDigest_(calibration.policyDigest) || !isSha256HexDigest_(calibration.datasetHash) ||
        !isSha256HexDigest_(calibration.validationEvidenceDigest)) return null;
    try {
      return apply_(jsonStringify_, JSON, [payload]);
    } catch (error) {
      return null;
    }
  }

  function isSha256HexDigest_(value) {
    if (typeof value !== 'string' || value.length !== 64) return false;
    for (let index = 0; index < value.length; index += 1) {
      const code = apply_(stringCharCodeAt_, value, [index]);
      if (!((code >= 48 && code <= 57) || (code >= 97 && code <= 102))) return false;
    }
    return true;
  }

  function sameStringConstantTime_(left, right) {
    if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false;
    let difference = 0;
    for (let index = 0; index < left.length; index += 1) {
      difference |= apply_(stringCharCodeAt_, left, [index]) ^ apply_(stringCharCodeAt_, right, [index]);
    }
    return difference === 0;
  }

  /** Loads the signed, versioned policy/calibration bundle from protected script properties. */
  function loadAuthenticatedCorrelationConfiguration_() {
    try {
      if (!propertiesService_ || typeof getScriptProperties_ !== 'function') return null;
      const properties = apply_(getScriptProperties_, propertiesService_, []);
      if (!properties || typeof properties.getProperty !== 'function') return null;
      const getProperty = properties.getProperty;
      const raw = apply_(getProperty, properties, [CONFIGURATION_PROPERTY_]);
      const signature = apply_(getProperty, properties, [SIGNATURE_PROPERTY_]);
      const key = apply_(getProperty, properties, [KEY_PROPERTY_]);
      if (typeof raw !== 'string' || !raw || typeof signature !== 'string' || !signature ||
          !isCanonicalHmacKey_(key)) return null;
      const expectedSignature = hmacBase64_(raw, key);
      if (!expectedSignature || !sameStringConstantTime_(signature, expectedSignature)) return null;

      const parsed = apply_(jsonParse_, null, [raw]);
      if (!hasExactKeys_(parsed, ['schemaVersion', 'version', 'policies', 'calibrations']) ||
          parsed.schemaVersion !== '1.0.0' || typeof parsed.version !== 'string' || !parsed.version ||
          !arrayIsArray_(parsed.policies) || !arrayIsArray_(parsed.calibrations)) return null;

      const frozen = freezeJson_(parsed);
      const configuration = freeze_({
        version: frozen.version,
        policies: frozen.policies,
        calibrations: frozen.calibrations
      });
      apply_(weakMapSet_, CONFIGURATION_AUTH_, [configuration, freeze_({
        bundle: frozen,
        signature,
        propertyVersion: '1'
      })]);
      return configuration;
    } catch (error) {
      return null;
    }
  }

  function getAuthenticatedCorrelationConfigurationEntry_(configuration, baseId, bindingType) {
    const authentication = apply_(weakMapGet_, CONFIGURATION_AUTH_, [configuration]);
    if (!authentication || typeof baseId !== 'string' || typeof bindingType !== 'string') return null;
    let policy = null;
    let policyCount = 0;
    for (let index = 0; index < configuration.policies.length; index += 1) {
      const item = configuration.policies[index];
      if (item && item.baseId === baseId && item.bindingType === bindingType) {
        policy = item;
        policyCount += 1;
      }
    }
    if (policyCount !== 1) return null;
    const matchingCalibrations = [];
    for (let index = 0; index < configuration.calibrations.length; index += 1) {
      const item = configuration.calibrations[index];
      if (item && item.baseId === baseId && item.bindingType === bindingType) {
        apply_(arrayPush_, matchingCalibrations, [item]);
      }
    }
    return freeze_({
      configurationVersion: configuration.version,
      configurationSignature: authentication.signature,
      policy,
      calibrations: freeze_(matchingCalibrations)
    });
  }

  Object.defineProperties(global, {
    loadAuthenticatedCorrelationConfiguration_: {
      value: loadAuthenticatedCorrelationConfiguration_, enumerable: false, writable: false, configurable: false
    },
    getAuthenticatedCorrelationConfigurationEntry_: {
      value: getAuthenticatedCorrelationConfigurationEntry_, enumerable: false, writable: false, configurable: false
    },
    verifyCorrelationAssessment_: {
      value: verifyCorrelationAssessment_, enumerable: false, writable: false, configurable: false
    },
    verifyEmpiricalCalibration_: {
      value: verifyEmpiricalCalibration_, enumerable: false, writable: false, configurable: false
    }
  });
})(globalThis);
