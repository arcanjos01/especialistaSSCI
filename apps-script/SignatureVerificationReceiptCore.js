(function installSignatureVerificationReceiptCore_(global) {
  'use strict';

  // This authenticates and binds a technical receipt. It does not establish a
  // trust profile, decide SIGNED, or expose receipt data to the Engine.
  const keyProperty_ = 'SSCI_SIGNATURE_VERIFICATION_HMAC_KEY';
  const keyIdProperty_ = 'SSCI_SIGNATURE_VERIFICATION_HMAC_KEY_ID';
  const contextKeys_ = [
    'presentationIdentity', 'rdeIdentity', 'rdeDigest',
    'sourceDocumentIdentity', 'sourceDocumentDigest'
  ];
  const payloadKeys_ = [
    'receiptType', 'schemaVersion', 'receiptId', 'presentationIdentity',
    'rdeIdentity', 'rdeDigest', 'sourceDocumentIdentity',
    'sourceDocumentDigest', 'verifierId', 'verifierVersion',
    'verifierExecutableSha256', 'createdAt', 'verificationResult'
  ];
  const inspectionKeys_ = [
    'verifier_version', 'pdfsig_version', 'openssl_version', 'document',
    'signature_count', 'signatures', 'trust', 'certificate_chain',
    'revocation', 'pades', 'professional_identity'
  ];

  function exactDataObject_(value, expectedKeys) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        Object.getPrototypeOf(value) !== Object.prototype ||
        Object.getOwnPropertySymbols(value).length !== 0) return false;
    const names = Object.getOwnPropertyNames(value);
    if (names.length !== expectedKeys.length) return false;
    for (let index = 0; index < expectedKeys.length; index += 1) {
      const key = expectedKeys[index];
      if (!Object.prototype.hasOwnProperty.call(value, key)) return false;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) return false;
    }
    return names.every(key => expectedKeys.includes(key) &&
      !['__proto__', 'prototype', 'constructor'].includes(key));
  }

  function safeJsonValue_(value, depth = 0, state = { nodes: 0 }) {
    state.nodes += 1;
    if (depth > 32 || state.nodes > 50000) return false;
    if (value === null || typeof value === 'boolean' ||
        (typeof value === 'string' && value.length <= 1000000) ||
        (typeof value === 'number' && Number.isSafeInteger(value))) return true;
    if (Array.isArray(value)) {
      if (Object.getOwnPropertySymbols(value).length !== 0 || value.length > 10000 ||
          Object.getOwnPropertyNames(value).length !== value.length + 1) return false;
      for (let index = 0; index < value.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value') ||
            !safeJsonValue_(descriptor.value, depth + 1, state)) return false;
      }
      return true;
    }
    if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype ||
        Object.getOwnPropertySymbols(value).length !== 0) return false;
    const names = Object.getOwnPropertyNames(value);
    if (names.length > 256) return false;
    for (let index = 0; index < names.length; index += 1) {
      const key = names[index];
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (['__proto__', 'prototype', 'constructor'].includes(key) || !/^[\x00-\x7f]*$/.test(key) || !descriptor ||
          !Object.prototype.hasOwnProperty.call(descriptor, 'value') || !descriptor.enumerable ||
          !safeJsonValue_(descriptor.value, depth + 1, state)) return false;
    }
    return true;
  }

  function canonicalJson_(value) {
    if (!safeJsonValue_(value)) throw new Error('unsafe receipt JSON');
    const serialized = canonicalJsonValue_(value);
    if (serialized.length > 2000000) throw new Error('receipt JSON exceeds size limit');
    return serialized;
  }

  function canonicalJsonValue_(value) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean' ||
        typeof value === 'number') return JSON.stringify(value);
    if (Array.isArray(value)) {
      let serialized = '';
      for (let index = 0; index < value.length; index += 1) {
        if (index !== 0) serialized += ',';
        serialized += canonicalJsonValue_(value[index]);
      }
      return '[' + serialized + ']';
    }
    const keys = Object.getOwnPropertyNames(value);
    for (let index = 1; index < keys.length; index += 1) {
      const current = keys[index];
      let position = index;
      while (position > 0 && current < keys[position - 1]) {
        keys[position] = keys[position - 1];
        position -= 1;
      }
      keys[position] = current;
    }
    let serialized = '';
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      if (index !== 0) serialized += ',';
      serialized += JSON.stringify(key) + ':' + canonicalJsonValue_(value[key]);
    }
    return '{' + serialized + '}';
  }

  function hasText_(value, limit) {
    return typeof value === 'string' && value.length > 0 && value.length <= limit &&
      value.trim() === value && !/[\u0000-\u001f]/.test(value);
  }

  function digest_(value) {
    return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
  }

  function canonicalKey_(value) {
    return typeof value === 'string' && value.length === 43 &&
      /^[A-Za-z0-9_-]{43}$/.test(value) && 'AEIMQUYcgkosw048'.includes(value.charAt(42));
  }

  function receiptKey_() {
    try {
      const properties = global.PropertiesService.getScriptProperties();
      const key = properties.getProperty(keyProperty_);
      const keyId = properties.getProperty(keyIdProperty_);
      return canonicalKey_(key) && hasText_(keyId, 128) ? { key, keyId } : null;
    } catch (error) {
      return null;
    }
  }

  function hmac_(payload, key) {
    try {
      const utilities = global.Utilities;
      return utilities.base64Encode(utilities.computeHmacSha256Signature(payload, key));
    } catch (error) {
      return null;
    }
  }

  function constantTimeEqual_(left, right) {
    if (typeof left !== 'string' || typeof right !== 'string') return false;
    let difference = left.length ^ right.length;
    const size = Math.max(left.length, right.length);
    for (let index = 0; index < size; index += 1) {
      difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
    }
    return difference === 0;
  }

  function validInspection_(result, sourceDigest) {
    if (!exactDataObject_(result, inspectionKeys_) ||
        !exactDataObject_(result.document, ['size', 'sha256']) ||
        !Number.isSafeInteger(result.document.size) || result.document.size < 1 ||
        result.document.sha256 !== sourceDigest ||
        !Number.isSafeInteger(result.signature_count) || result.signature_count < 0 ||
        !Array.isArray(result.signatures) || result.signatures.length !== result.signature_count ||
        !hasText_(result.verifier_version, 128) || !hasText_(result.pdfsig_version, 128) ||
        !hasText_(result.openssl_version, 128) || !hasText_(result.trust, 128) ||
        !hasText_(result.revocation, 128) || !hasText_(result.pades, 128) ||
        !hasText_(result.professional_identity, 128) ||
        !exactDataObject_(result.certificate_chain, ['result', 'trust_anchor_bundle_sha256']) ||
        !hasText_(result.certificate_chain.result, 128) ||
        (result.certificate_chain.trust_anchor_bundle_sha256 !== null &&
          !digest_(result.certificate_chain.trust_anchor_bundle_sha256))) return false;
    return safeJsonValue_(result);
  }

  function verifySignatureVerificationReceipt_(receipt, expectedContext) {
    try {
      if (!exactDataObject_(receipt, ['payload', 'authentication']) ||
          !exactDataObject_(receipt.payload, payloadKeys_) ||
          !exactDataObject_(receipt.authentication, ['keyId', 'algorithm', 'signature']) ||
          !exactDataObject_(expectedContext, contextKeys_)) return false;
      const payload = receipt.payload;
      const auth = receipt.authentication;
      const key = receiptKey_();
      if (!key || auth.keyId !== key.keyId || auth.algorithm !== 'HMAC_SHA256' ||
          !hasText_(auth.signature, 128) || !/^[A-Za-z0-9+/]{43}=$/.test(auth.signature) ||
          payload.receiptType !== 'LOCAL_PDF_SIGNATURE_VERIFICATION_RECEIPT' ||
          payload.schemaVersion !== '1.0.0' || !hasText_(payload.receiptId, 128) ||
          !hasText_(payload.verifierId, 128) || !hasText_(payload.verifierVersion, 128) ||
          !digest_(payload.verifierExecutableSha256) || !hasText_(payload.createdAt, 64) ||
          !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,6})?Z$/.test(payload.createdAt) ||
          payload.verificationResult.verifier_version !== payload.verifierVersion ||
          !validInspection_(payload.verificationResult, payload.sourceDocumentDigest)) return false;
      for (let index = 0; index < contextKeys_.length; index += 1) {
        const name = contextKeys_[index];
        const value = expectedContext[name];
        if (payload[name] !== value) return false;
        if (name === 'rdeDigest' || name === 'sourceDocumentDigest') {
          if (!digest_(value)) return false;
        } else if (!hasText_(value, 512)) return false;
      }
      const expected = hmac_(canonicalJson_(payload), key.key);
      return !!expected && constantTimeEqual_(expected, auth.signature);
    } catch (error) {
      return false;
    }
  }

  Object.defineProperty(global, 'verifySignatureVerificationReceipt_', {
    value: verifySignatureVerificationReceipt_, enumerable: false,
    writable: false, configurable: false
  });
})(globalThis);
