(function installHumanSignatureReviewCore_(global) {
  'use strict';

  const hmacKeyProperty_ = 'SSCI_HUMAN_SIGNATURE_REVIEW_HMAC_KEY';
  const hmacKeyIdProperty_ = 'SSCI_HUMAN_SIGNATURE_REVIEW_HMAC_KEY_ID';
  const expectedPayloadKeys_ = [
    'schemaVersion', 'receiptId', 'presentationIdentity', 'rdeIdentity', 'rdeDigest',
    'sourceDocumentIdentity', 'sourceDocumentDigest', 'reviewerIdentity', 'recordedAt',
    'reviewMethod', 'methodDetails', 'evidenceReferences', 'decision',
    'cryptographicStatus', 'authorityStatus'
  ];
  const expectedEnvelopeKeys_ = ['payload', 'authentication'];
  const arrayConstructor_ = Array;
  const arrayIsArray_ = Array.isArray;
  const getOwnPropertyDescriptor_ = Object.getOwnPropertyDescriptor;
  const getOwnPropertyNames_ = Object.getOwnPropertyNames;
  const getOwnPropertySymbols_ = Object.getOwnPropertySymbols;
  const getPrototypeOf_ = Object.getPrototypeOf;
  const objectKeys_ = Object.keys;
  const defineProperty_ = Object.defineProperty;
  const freeze_ = Object.freeze;
  const stringify_ = JSON.stringify;
  const hasOwn_ = Function.call.bind(Object.prototype.hasOwnProperty);

  function ownArrayLength_(value) {
    if (!arrayIsArray_(value) || getOwnPropertySymbols_(value).length !== 0) return null;
    const lengthDescriptor = getOwnPropertyDescriptor_(value, 'length');
    if (!lengthDescriptor || !hasOwn_(lengthDescriptor, 'value') ||
        !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value < 0 ||
        lengthDescriptor.value > 10000 ||
        getOwnPropertyNames_(value).length !== lengthDescriptor.value + 1) return null;
    return lengthDescriptor.value;
  }

  function sortStrings_(values) {
    for (let index = 1; index < values.length; index += 1) {
      const current = values[index];
      let position = index;
      while (position > 0 && current < values[position - 1]) {
        values[position] = values[position - 1];
        position -= 1;
      }
      values[position] = current;
    }
    return values;
  }

  function includesString_(values, target) {
    for (let index = 0; index < values.length; index += 1) {
      if (values[index] === target) return true;
    }
    return false;
  }

  function exactDataObject_(value, expectedKeys) {
    if (!value || typeof value !== 'object' || arrayIsArray_(value) ||
        getPrototypeOf_(value) !== Object.prototype || getOwnPropertySymbols_(value).length) return false;
    const keys = objectKeys_(value);
    if (getOwnPropertyNames_(value).length !== keys.length || keys.length !== expectedKeys.length) return false;
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      if (!includesString_(expectedKeys, key) ||
          !hasOwn_(getOwnPropertyDescriptor_(value, key), 'value')) return false;
    }
    return true;
  }

  function immutableJson_(value) {
    if (arrayIsArray_(value)) {
      const length = ownArrayLength_(value);
      if (length === null) throw new Error('signature review receipt contains an invalid array');
      const copy = new arrayConstructor_(length);
      for (let index = 0; index < length; index += 1) {
        const descriptor = getOwnPropertyDescriptor_(value, String(index));
        if (!descriptor || !hasOwn_(descriptor, 'value') || !descriptor.enumerable) {
          throw new Error('signature review receipt contains a sparse or accessor array');
        }
        defineProperty_(copy, String(index), {
          value: immutableJson_(descriptor.value), enumerable: true,
          writable: false, configurable: false
        });
      }
      return freeze_(copy);
    }
    if (!value || typeof value !== 'object') return value;
    const copy = {};
    const keys = sortStrings_(objectKeys_(value));
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        throw new Error('signature review receipt contains an unsafe property');
      }
      const descriptor = getOwnPropertyDescriptor_(value, key);
      if (!descriptor || !hasOwn_(descriptor, 'value')) {
        throw new Error('signature review receipt contains an accessor property');
      }
      defineProperty_(copy, key, {
        value: immutableJson_(descriptor.value), enumerable: true, writable: false, configurable: false
      });
    }
    return freeze_(copy);
  }

  function canonicalJson_(value) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return stringify_(value);
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new Error('signature review receipt contains a non-finite number');
      return stringify_(value);
    }
    if (arrayIsArray_(value)) {
      const length = ownArrayLength_(value);
      if (length === null) throw new Error('signature review receipt contains an invalid array');
      let serialized = '[';
      for (let index = 0; index < length; index += 1) {
        if (index !== 0) serialized += ',';
        const descriptor = getOwnPropertyDescriptor_(value, String(index));
        if (!descriptor || !hasOwn_(descriptor, 'value') || !descriptor.enumerable) {
          throw new Error('signature review receipt contains a sparse or accessor array');
        }
        serialized += canonicalJson_(descriptor.value);
      }
      return serialized + ']';
    }
    if (!value || typeof value !== 'object' || getPrototypeOf_(value) !== Object.prototype) {
      throw new Error('signature review receipt contains an unsupported value');
    }
    const keys = sortStrings_(objectKeys_(value));
    let serialized = '{';
    for (let index = 0; index < keys.length; index += 1) {
      if (index !== 0) serialized += ',';
      const key = keys[index];
      const descriptor = getOwnPropertyDescriptor_(value, key);
      if (!descriptor || !hasOwn_(descriptor, 'value')) {
        throw new Error('signature review receipt contains an accessor property');
      }
      serialized += stringify_(key) + ':' + canonicalJson_(descriptor.value);
    }
    return serialized + '}';
  }

  function hasText_(value, maxLength) {
    return typeof value === 'string' && value.length > 0 && value.length <= maxLength && value.trim() === value;
  }

  function digest_(value) {
    return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
  }

  function receiptKey_() {
    const properties = global.PropertiesService && global.PropertiesService.getScriptProperties();
    if (!properties || typeof properties.getProperty !== 'function') return null;
    const key = properties.getProperty(hmacKeyProperty_);
    const keyId = properties.getProperty(hmacKeyIdProperty_);
    if (!isCanonicalHmacKey_(key) || !hasText_(keyId, 128)) return null;
    return { key, keyId };
  }

  function isCanonicalHmacKey_(key) {
    if (typeof key !== 'string' || key.length !== 43 || !/^[A-Za-z0-9_-]{43}$/.test(key)) return false;
    return includesString_('AEIMQUYcgkosw048', key.charAt(42));
  }

  function hmac_(payload, key) {
    const utilities = global.Utilities;
    if (!utilities || typeof utilities.computeHmacSha256Signature !== 'function' ||
        typeof utilities.base64Encode !== 'function') return null;
    return utilities.base64Encode(utilities.computeHmacSha256Signature(payload, key));
  }

  function constantTimeEqual_(left, right) {
    if (typeof left !== 'string' || typeof right !== 'string') return false;
    let difference = left.length ^ right.length;
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index += 1) {
      difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
    }
    return difference === 0;
  }

  function authenticatedReviewer_() {
    const session = global.Session;
    if (!session || typeof session.getActiveUser !== 'function') return null;
    const user = session.getActiveUser();
    const email = user && typeof user.getEmail === 'function' ? user.getEmail() : '';
    return hasText_(email, 320) ? email : null;
  }

  function validateEvidenceReferences_(items) {
    const length = ownArrayLength_(items);
    if (length === null || length < 1 || length > 32) return false;
    for (let index = 0; index < length; index += 1) {
      const descriptor = getOwnPropertyDescriptor_(items, String(index));
      if (!descriptor || !hasOwn_(descriptor, 'value') || !descriptor.enumerable) return false;
      const item = descriptor.value;
      if (!exactDataObject_(item, ['documentIdentity', 'documentDigest', 'locator', 'description']) ||
          !hasText_(item.documentIdentity, 512) || !digest_(item.documentDigest) ||
          !hasText_(item.locator, 1024) || !hasText_(item.description, 2048)) return false;
    }
    return true;
  }

  function createHumanSignatureReviewReceipt_(context, review) {
    const contextKeys = ['currentSubmissionContext', 'rdeIdentity', 'rdeDigest',
      'sourceDocumentIdentity', 'sourceDocumentDigest'];
    const reviewKeys = ['reviewMethod', 'methodDetails', 'evidenceReferences', 'decision'];
    if (!exactDataObject_(context, contextKeys) || !exactDataObject_(review, reviewKeys) ||
        !hasValidContextText_(context, contextKeys) ||
        !digest_(context.rdeDigest) || !digest_(context.sourceDocumentDigest) ||
        !includesString_(['IN_DOCUMENT_VISUAL', 'DOCUMENT_METADATA', 'OTHER'], review.reviewMethod) ||
        !hasText_(review.methodDetails, 2048) || !validateEvidenceReferences_(review.evidenceReferences) ||
        !includesString_(['CONFIRMED_SIGNATURE_PRESENT', 'NOT_CONFIRMED', 'INCONCLUSIVE'], review.decision)) {
      throw new Error('invalid human signature review input');
    }
    const presentationIdentity = global.getCanonicalPresentationIdentity(
      context.currentSubmissionContext
    );
    if (!hasText_(presentationIdentity, 512)) {
      throw new Error('invalid human signature review input');
    }
    const reviewer = authenticatedReviewer_();
    const key = receiptKey_();
    const utilities = global.Utilities;
    if (!reviewer || !key || !utilities || typeof utilities.getUuid !== 'function') {
      throw new Error('authenticated reviewer or project receipt key unavailable');
    }
    const payload = {
      schemaVersion: '1.0.0',
      receiptId: utilities.getUuid(),
      presentationIdentity,
      rdeIdentity: context.rdeIdentity,
      rdeDigest: context.rdeDigest,
      sourceDocumentIdentity: context.sourceDocumentIdentity,
      sourceDocumentDigest: context.sourceDocumentDigest,
      reviewerIdentity: reviewer,
      recordedAt: new Date().toISOString(),
      reviewMethod: review.reviewMethod,
      methodDetails: review.methodDetails,
      evidenceReferences: review.evidenceReferences,
      decision: review.decision,
      cryptographicStatus: 'NOT_EVALUATED_BY_HUMAN_REVIEW',
      authorityStatus: 'NOT_ESTABLISHED_AUDIT_ONLY'
    };
    const canonicalPayload = canonicalJson_(payload);
    const signature = hmac_(canonicalPayload, key.key);
    if (!signature) throw new Error('project receipt authentication unavailable');
    return immutableJson_({
      payload,
      authentication: { keyId: key.keyId, algorithm: 'HMAC_SHA256', signature }
    });
  }

  function hasValidContextText_(context, keys) {
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      if (key !== 'currentSubmissionContext' && !hasText_(context[key], 512)) return false;
    }
    return true;
  }

  function verifyHumanSignatureReviewReceipt_(receipt, expectedContext) {
    try {
      if (!exactDataObject_(receipt, expectedEnvelopeKeys_) ||
          !exactDataObject_(receipt.payload, expectedPayloadKeys_) ||
          !exactDataObject_(receipt.authentication, ['keyId', 'algorithm', 'signature']) ||
          !exactDataObject_(expectedContext, ['currentSubmissionContext', 'rdeIdentity', 'rdeDigest',
            'sourceDocumentIdentity', 'sourceDocumentDigest'])) return false;
      const payload = receipt.payload;
      const authentication = receipt.authentication;
      const key = receiptKey_();
      const presentationIdentity = global.getCanonicalPresentationIdentity(
        expectedContext.currentSubmissionContext
      );
      if (!key || authentication.keyId !== key.keyId || authentication.algorithm !== 'HMAC_SHA256' ||
          presentationIdentity !== payload.presentationIdentity ||
          expectedContext.rdeIdentity !== payload.rdeIdentity || expectedContext.rdeDigest !== payload.rdeDigest ||
          expectedContext.sourceDocumentIdentity !== payload.sourceDocumentIdentity ||
          expectedContext.sourceDocumentDigest !== payload.sourceDocumentDigest ||
          !hasText_(authentication.signature, 256) || payload.schemaVersion !== '1.0.0' ||
          !hasText_(payload.receiptId, 128) || !hasText_(payload.presentationIdentity, 512) ||
          !hasText_(payload.rdeIdentity, 512) || !digest_(payload.rdeDigest) ||
          !hasText_(payload.sourceDocumentIdentity, 512) || !digest_(payload.sourceDocumentDigest) ||
          !hasText_(payload.reviewerIdentity, 320) || !hasText_(payload.recordedAt, 64) ||
          !includesString_(['IN_DOCUMENT_VISUAL', 'DOCUMENT_METADATA', 'OTHER'], payload.reviewMethod) ||
          !hasText_(payload.methodDetails, 2048) || !validateEvidenceReferences_(payload.evidenceReferences) ||
          !includesString_(['CONFIRMED_SIGNATURE_PRESENT', 'NOT_CONFIRMED', 'INCONCLUSIVE'], payload.decision) ||
          payload.cryptographicStatus !== 'NOT_EVALUATED_BY_HUMAN_REVIEW' ||
          payload.authorityStatus !== 'NOT_ESTABLISHED_AUDIT_ONLY') return false;
      const expected = hmac_(canonicalJson_(payload), key.key);
      return !!expected && constantTimeEqual_(expected, authentication.signature);
    } catch (error) {
      return false;
    }
  }

  Object.defineProperties(global, {
    createHumanSignatureReviewReceipt_: {
      value: createHumanSignatureReviewReceipt_, enumerable: false, writable: false, configurable: false
    },
    verifyHumanSignatureReviewReceipt_: {
      value: verifyHumanSignatureReviewReceipt_, enumerable: false, writable: false, configurable: false
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
