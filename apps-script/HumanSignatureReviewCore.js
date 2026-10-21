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

  function exactDataObject_(value, expectedKeys) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        Object.getPrototypeOf(value) !== Object.prototype || Object.getOwnPropertySymbols(value).length) return false;
    const keys = Object.keys(value);
    if (Object.getOwnPropertyNames(value).length !== keys.length || keys.length !== expectedKeys.length) return false;
    return keys.every(key => expectedKeys.includes(key) &&
      Object.prototype.hasOwnProperty.call(Object.getOwnPropertyDescriptor(value, key), 'value'));
  }

  function immutableJson_(value) {
    if (Array.isArray(value)) return Object.freeze(value.map(immutableJson_));
    if (!value || typeof value !== 'object') return value;
    const copy = {};
    Object.keys(value).sort().forEach(key => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        throw new Error('signature review receipt contains an unsafe property');
      }
      Object.defineProperty(copy, key, {
        value: immutableJson_(value[key]), enumerable: true, writable: false, configurable: false
      });
    });
    return Object.freeze(copy);
  }

  function canonicalJson_(value) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new Error('signature review receipt contains a non-finite number');
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) return '[' + value.map(canonicalJson_).join(',') + ']';
    if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) {
      throw new Error('signature review receipt contains an unsupported value');
    }
    const keys = Object.keys(value).sort();
    return '{' + keys.map(key => JSON.stringify(key) + ':' + canonicalJson_(value[key])).join(',') + '}';
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
    return 'AEIMQUYcgkosw048'.includes(key.charAt(42));
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
    if (!Array.isArray(items) || items.length < 1 || items.length > 32 ||
        Object.getOwnPropertySymbols(items).length ||
        Object.getOwnPropertyNames(items).length !== items.length + 1) return false;
    for (let index = 0; index < items.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(items, String(index));
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) return false;
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
        !contextKeys.filter(key => key !== 'currentSubmissionContext')
          .every(key => hasText_(context[key], 512)) ||
        !digest_(context.rdeDigest) || !digest_(context.sourceDocumentDigest) ||
        !['IN_DOCUMENT_VISUAL', 'DOCUMENT_METADATA', 'OTHER'].includes(review.reviewMethod) ||
        !hasText_(review.methodDetails, 2048) || !validateEvidenceReferences_(review.evidenceReferences) ||
        !['CONFIRMED_SIGNATURE_PRESENT', 'NOT_CONFIRMED', 'INCONCLUSIVE'].includes(review.decision)) {
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
          !['IN_DOCUMENT_VISUAL', 'DOCUMENT_METADATA', 'OTHER'].includes(payload.reviewMethod) ||
          !hasText_(payload.methodDetails, 2048) || !validateEvidenceReferences_(payload.evidenceReferences) ||
          !['CONFIRMED_SIGNATURE_PRESENT', 'NOT_CONFIRMED', 'INCONCLUSIVE'].includes(payload.decision) ||
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
