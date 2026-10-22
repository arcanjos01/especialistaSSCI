(function installSignatureVerificationReceiptCore_(global) {
  'use strict';

  // This authenticates and binds a technical receipt. It does not establish a
  // trust profile, decide SIGNED, or expose receipt data to the Engine.
  const keyIdProperty_ = 'SSCI_SIGNATURE_VERIFICATION_RSA_KEY_ID';
  const modulusProperty_ = 'SSCI_SIGNATURE_VERIFICATION_RSA_MODULUS_HEX';
  const exponentProperty_ = 'SSCI_SIGNATURE_VERIFICATION_RSA_EXPONENT_HEX';
  const profileKeyIdProperty_ = 'SSCI_SIGNATURE_ADMISSION_PROFILE_RSA_KEY_ID';
  const profileModulusProperty_ = 'SSCI_SIGNATURE_ADMISSION_PROFILE_RSA_MODULUS_HEX';
  const profileExponentProperty_ = 'SSCI_SIGNATURE_ADMISSION_PROFILE_RSA_EXPONENT_HEX';
  const contextKeys_ = [
    'currentSubmissionContext', 'rdeIdentity', 'rdeDigest',
    'sourceDocumentIdentity', 'sourceDocumentDigest'
  ];
  const payloadKeys_ = [
    'receiptType', 'schemaVersion', 'receiptId', 'presentationIdentity',
    'rdeIdentity', 'rdeDigest', 'sourceDocumentIdentity',
    'sourceDocumentDigest', 'verifierId', 'verifierVersion',
    'verifierSourceSha256', 'createdAt', 'verificationResult'
  ];
  const inspectionKeys_ = [
    'verifier_version', 'pdfsig_version', 'openssl_version', 'document',
    'signature_count', 'signatures', 'trust', 'certificate_chain',
    'revocation', 'pades', 'professional_identity', 'verifier_components'
  ];
  const executionBindings_ = new WeakMap();
  const boundReceiptIds_ = new Set();
  const apply_ = Reflect.apply;
  const weakGet_ = WeakMap.prototype.get;
  const weakSet_ = WeakMap.prototype.set;
  const setHas_ = Set.prototype.has;
  const setAdd_ = Set.prototype.add;
  const parse_ = JSON.parse;
  const stringify_ = JSON.stringify;
  const isFrozen_ = Object.isFrozen;
  const freeze_ = Object.freeze;
  const names_ = Object.getOwnPropertyNames;
  const descriptor_ = Object.getOwnPropertyDescriptor;
  const define_ = Object.defineProperty;
  const isArray_ = Array.isArray;

  // Only internally constructed data or parsed JSON reaches this copier.
  function copyFrozen_(value) {
    if (value === null || typeof value !== 'object') return value;
    const copy = isArray_(value) ? [] : {};
    const keys = names_(value);
    for (let index = 0; index < keys.length; index += 1) {
      const name = keys[index];
      if (isArray_(value) && name === 'length') continue;
      const item = descriptor_(value, name);
      if (!item || !Object.prototype.hasOwnProperty.call(item, 'value')) {
        throw new Error('binding snapshot requires data properties');
      }
      define_(copy, name, { value: copyFrozen_(item.value), enumerable: true });
    }
    return freeze_(copy);
  }

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
        typeof value === 'number') return stringify_(value);
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
      serialized += stringify_(key) + ':' + canonicalJsonValue_(value[key]);
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

  function receiptPublicKey_() {
    try {
      const properties = global.PropertiesService.getScriptProperties();
      const keyId = properties.getProperty(keyIdProperty_);
      const modulusHex = properties.getProperty(modulusProperty_);
      const exponentHex = properties.getProperty(exponentProperty_);
      if (!hasText_(keyId, 128) || typeof modulusHex !== 'string' ||
          !/^(?:[89a-f][0-9a-f]{511}|[89a-f][0-9a-f]{767}|[89a-f][0-9a-f]{1023})$/.test(modulusHex) ||
          exponentHex !== '010001') return null;
      return { keyId, modulusHex, exponentHex };
    } catch (error) {
      return null;
    }
  }

  function admissionProfilePublicKey_() {
    try {
      const properties = global.PropertiesService.getScriptProperties();
      const keyId = properties.getProperty(profileKeyIdProperty_);
      const modulusHex = properties.getProperty(profileModulusProperty_);
      const exponentHex = properties.getProperty(profileExponentProperty_);
      if (!hasText_(keyId, 128) || typeof modulusHex !== 'string' ||
          !/^(?:[89a-f][0-9a-f]{511}|[89a-f][0-9a-f]{767}|[89a-f][0-9a-f]{1023})$/.test(modulusHex) ||
          exponentHex !== '010001') return null;
      return { keyId, modulusHex, exponentHex };
    } catch (error) {
      return null;
    }
  }

  function bytesToHex_(bytes) {
    let result = '';
    for (let index = 0; index < bytes.length; index += 1) {
      const octet = bytes[index] & 255;
      result += (octet < 16 ? '0' : '') + octet.toString(16);
    }
    return result;
  }

  function modularExponentiation_(base, exponent, modulus) {
    let result = BigInt(1);
    let factor = base % modulus;
    let power = exponent;
    while (power > BigInt(0)) {
      if (power % BigInt(2) === BigInt(1)) result = (result * factor) % modulus;
      power = power / BigInt(2);
      factor = (factor * factor) % modulus;
    }
    return result;
  }

  function verifyRsaSha256_(canonicalPayload, signatureText, key) {
    try {
      const utilities = global.Utilities;
      const signatureBytes = utilities.base64Decode(signatureText);
      const keyBytes = key.modulusHex.length / 2;
      if (!Array.isArray(signatureBytes) || signatureBytes.length !== keyBytes ||
          utilities.base64Encode(signatureBytes) !== signatureText) return false;

      const digestBytes = utilities.computeDigest(
        utilities.DigestAlgorithm.SHA_256,
        canonicalPayload,
        utilities.Charset.UTF_8
      );
      if (!Array.isArray(digestBytes) || digestBytes.length !== 32) return false;

      const modulus = BigInt('0x' + key.modulusHex);
      const exponent = BigInt('0x' + key.exponentHex);
      const signature = BigInt('0x' + bytesToHex_(signatureBytes));
      if (signature >= modulus) return false;
      const recovered = modularExponentiation_(signature, exponent, modulus);
      let encodedHex = recovered.toString(16);
      while (encodedHex.length < keyBytes * 2) encodedHex = '0' + encodedHex;
      if (encodedHex.length !== keyBytes * 2) return false;

      const digestInfoHex = '3031300d060960864801650304020105000420' + bytesToHex_(digestBytes);
      const paddingLength = keyBytes - (digestInfoHex.length / 2) - 3;
      if (paddingLength < 8) return false;
      let expectedHex = '0001';
      for (let index = 0; index < paddingLength; index += 1) expectedHex += 'ff';
      expectedHex += '00' + digestInfoHex;
      if (expectedHex.length !== encodedHex.length) return false;
      let difference = 0;
      for (let index = 0; index < expectedHex.length; index += 1) {
        difference |= expectedHex.charCodeAt(index) ^ encodedHex.charCodeAt(index);
      }
      return difference === 0;
    } catch (error) {
      return false;
    }
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
        !exactDataObject_(result.verifier_components, [
          'pdfsig_executable_sha256', 'openssl_executable_sha256'
        ]) || !digest_(result.verifier_components.pdfsig_executable_sha256) ||
        !digest_(result.verifier_components.openssl_executable_sha256) ||
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
      const key = receiptPublicKey_();
      if (!key || auth.keyId !== key.keyId ||
          !hasText_(auth.signature, 2048) || !/^[A-Za-z0-9+/]+={0,2}$/.test(auth.signature) ||
          payload.receiptType !== 'LOCAL_PDF_SIGNATURE_VERIFICATION_RECEIPT' ||
          payload.schemaVersion !== '1.1.0' || !hasText_(payload.receiptId, 128) ||
          !hasText_(payload.verifierId, 128) || !hasText_(payload.verifierVersion, 128) ||
          !digest_(payload.verifierSourceSha256) || !hasText_(payload.createdAt, 64) ||
          !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,6})?Z$/.test(payload.createdAt) ||
          payload.verificationResult.verifier_version !== payload.verifierVersion ||
          !validInspection_(payload.verificationResult, payload.sourceDocumentDigest)) return false;
      const presentationIdentity = global.getCanonicalPresentationIdentity(
        expectedContext.currentSubmissionContext
      );
      if (!hasText_(presentationIdentity, 512) ||
          payload.presentationIdentity !== presentationIdentity) return false;
      for (let index = 0; index < contextKeys_.length; index += 1) {
        const name = contextKeys_[index];
        if (name === 'currentSubmissionContext') continue;
        const value = expectedContext[name];
        if (payload[name] !== value) return false;
        if (name === 'rdeDigest' || name === 'sourceDocumentDigest') {
          if (!digest_(value)) return false;
        } else if (!hasText_(value, 512)) return false;
      }
      if (auth.algorithm !== 'RSA_SHA256_PKCS1_V1_5') return false;
      return verifyRsaSha256_(canonicalJson_(payload), auth.signature, key);
    } catch (error) {
      return false;
    }
  }

  function sha256_(value) {
    try {
      const bytes = global.Utilities.computeDigest(
        global.Utilities.DigestAlgorithm.SHA_256,
        value, global.Utilities.Charset.UTF_8
      );
      return Array.isArray(bytes) && bytes.length === 32 ? bytesToHex_(bytes) : null;
    } catch (error) {
      return null;
    }
  }

  const admissionProfilePayloadKeys_ = [
    'profileType', 'schemaVersion', 'compiledContractDigest',
    'policyId', 'policyVersion', 'policyDigest', 'permittedMechanism',
    'trustedIssuerSet', 'trustedIssuerSetDigest', 'requiredCryptographicChecks',
    'requiredSignerIssuerRole', 'validationLevel', 'unknownTreatment'
  ];
  const admissionProfileAuthenticationKeys_ = ['keyId', 'algorithm', 'digest', 'signature'];

  function validAdmissionProfilePayload_(payload, contractDigest) {
    return exactDataObject_(payload, admissionProfilePayloadKeys_) &&
      payload.profileType === 'SIGNATURE_ADMISSION_PROFILE' &&
      payload.schemaVersion === '0.2.0' && digest_(payload.compiledContractDigest) &&
      payload.compiledContractDigest === contractDigest && hasText_(payload.policyId, 128) &&
      hasText_(payload.policyVersion, 64) && digest_(payload.policyDigest) &&
      hasText_(payload.permittedMechanism, 128) &&
      Array.isArray(payload.trustedIssuerSet) && payload.trustedIssuerSet.length > 0 &&
      payload.trustedIssuerSet.length <= 256 &&
      payload.trustedIssuerSet.every(value => hasText_(value, 256)) &&
      new Set(payload.trustedIssuerSet).size === payload.trustedIssuerSet.length &&
      digest_(payload.trustedIssuerSetDigest) &&
      payload.trustedIssuerSetDigest === sha256_(canonicalJsonValue_(payload.trustedIssuerSet)) &&
      Array.isArray(payload.requiredCryptographicChecks) &&
      payload.requiredCryptographicChecks.length > 0 &&
      payload.requiredCryptographicChecks.length <= 256 &&
      payload.requiredCryptographicChecks.every(value => hasText_(value, 128)) &&
      new Set(payload.requiredCryptographicChecks).size === payload.requiredCryptographicChecks.length &&
      hasText_(payload.requiredSignerIssuerRole, 128) &&
      hasText_(payload.validationLevel, 128) &&
      payload.unknownTreatment === 'MANUAL_REVIEW' && safeJsonValue_(payload);
  }

  // Preparatory only: authenticates a profile with a distinct pinned authority
  // key and checks contract applicability. It never admits SIGNED or Engine input.
  function verifySignatureAdmissionProfile_(profileJson, contract) {
    try {
      if (typeof profileJson !== 'string' || profileJson.length > 2000000 ||
          typeof global.isCanonicalCompiledRuntimeContract !== 'function' ||
          !global.isCanonicalCompiledRuntimeContract(contract)) return false;
      const profile = copyFrozen_(parse_(profileJson));
      if (!exactDataObject_(profile, ['payload', 'authentication']) ||
          !exactDataObject_(profile.authentication, admissionProfileAuthenticationKeys_)) return false;
      const contractDigest = sha256_(canonicalJsonValue_(contract));
      const payload = profile.payload;
      const auth = profile.authentication;
      const key = admissionProfilePublicKey_();
      const verifierKey = receiptPublicKey_();
      if (!key || auth.keyId !== key.keyId || auth.algorithm !== 'RSA_SHA256_PKCS1_V1_5' ||
          !verifierKey || key.keyId === verifierKey.keyId ||
          key.modulusHex === verifierKey.modulusHex || key.exponentHex !== verifierKey.exponentHex ||
          !digest_(auth.digest) || auth.digest !== sha256_(canonicalJsonValue_(payload)) ||
          !hasText_(auth.signature, 2048) || !/^[A-Za-z0-9+/]+={0,2}$/.test(auth.signature) ||
          !validAdmissionProfilePayload_(payload, contractDigest)) return false;
      return verifyRsaSha256_(canonicalJson_(payload), auth.signature, key);
    } catch (error) {
      return false;
    }
  }

  // Preparatory only: there is no authenticated per-document external
  // identity/digest map or approved admission profile in the current contracts.
  function createTechnicalReceiptExecutionBinding_(receiptJson, contract, plan, view, rde,
    sourceDocument, currentSubmissionContext, admissionProfileJson) {
    try {
      if (typeof receiptJson !== 'string' || receiptJson.length > 2000000) return null;
      const receipt = copyFrozen_(parse_(receiptJson));
      if (typeof global.isCanonicalCompiledRuntimeContract !== 'function' ||
          !global.isCanonicalCompiledRuntimeContract(contract) ||
          typeof global.isCanonicalFrozenExecutionPlan !== 'function' ||
          !global.isCanonicalFrozenExecutionPlan(plan, contract, view) ||
          typeof global.isExecutionViewDerivedFromRde_ !== 'function' ||
          typeof global.getValidatedRdeIdentity_ !== 'function' ||
          typeof global.getValidatedRdeDigest_ !== 'function' ||
          typeof global.isCanonicalCurrentSubmissionContext !== 'function' ||
          !global.isCanonicalCurrentSubmissionContext(currentSubmissionContext) ||
          typeof global.selectCurrentComprovante !== 'function' ||
          !(sourceDocument instanceof TypedReference) || !isFrozen_(sourceDocument) ||
          !descriptor_(sourceDocument, 'kind') || !descriptor_(sourceDocument, 'identifier') ||
          !Object.prototype.hasOwnProperty.call(descriptor_(sourceDocument, 'kind'), 'value') ||
          !Object.prototype.hasOwnProperty.call(descriptor_(sourceDocument, 'identifier'), 'value') ||
          sourceDocument.kind !== 'DOCUMENT' ||
          !view.contains(sourceDocument)) return null;
      const exactSource = view.sourceDocument(sourceDocument);
      if (exactSource.kind !== sourceDocument.kind ||
          exactSource.identifier !== sourceDocument.identifier) return null;
      const rdeIdentity = global.getValidatedRdeIdentity_(rde);
      const rdeDigest = global.getValidatedRdeDigest_(rde);
      if (!hasText_(rdeIdentity, 512) || !digest_(rdeDigest) ||
          !global.isExecutionViewDerivedFromRde_(view, rde, rdeDigest)) return null;
      const presentation = global.selectCurrentComprovante(view, currentSubmissionContext);
      if (!presentation || !plan.selectedComprovante ||
          presentation.kind !== plan.selectedComprovante.kind ||
          presentation.identifier !== plan.selectedComprovante.identifier) return null;
      const expectedContext = {
        currentSubmissionContext, rdeIdentity, rdeDigest,
        sourceDocumentIdentity: receipt && receipt.payload && receipt.payload.sourceDocumentIdentity,
        sourceDocumentDigest: receipt && receipt.payload && receipt.payload.sourceDocumentDigest
      };
      if (!verifySignatureVerificationReceipt_(receipt, expectedContext) ||
          apply_(setHas_, boundReceiptIds_, [receipt.payload.receiptId])) return null;
      // Both inputs are already authenticated, frozen canonical objects. Their
      // runtime JSON serialization is only an identity digest, never a new
      // normative representation.
      const contractDigest = sha256_(canonicalJsonValue_(contract));
      const planDigest = sha256_(canonicalJsonValue_(plan));
      if (!digest_(contractDigest) || !digest_(planDigest)) return null;
      const profileAuthenticated = typeof admissionProfileJson === 'string' &&
        verifySignatureAdmissionProfile_(admissionProfileJson, contract);
      const binding = copyFrozen_({
        bindingType: 'TECHNICAL_SIGNATURE_RECEIPT_EXECUTION_BINDING', schemaVersion: '0.1.0',
        receiptId: receipt.payload.receiptId, compiledContractDigest: contractDigest,
        frozenExecutionPlanDigest: planDigest, rdeIdentity, rdeDigest,
        presentationIdentity: global.getCanonicalPresentationIdentity(currentSubmissionContext),
        sourceDocumentReference: { kind: sourceDocument.kind, identifier: sourceDocument.identifier },
        sourceDocumentIdentity: receipt.payload.sourceDocumentIdentity,
        sourceDocumentDigest: receipt.payload.sourceDocumentDigest,
        admissionStatus: 'MANUAL_REVIEW', diagnostics: [
          profileAuthenticated ? 'ADMISSION_PROFILE_AUTHENTICATED_PREPARATORY_ONLY' :
            'ADMISSION_PROFILE_UNDEFINED',
          'SOURCE_DOCUMENT_IDENTITY_DIGEST_NOT_INDEPENDENTLY_AUTHENTICATED'
        ]
      });
      apply_(weakSet_, executionBindings_, [binding, freeze_({
        receipt, contract, plan, view, rde, sourceDocument, currentSubmissionContext
      })]);
      apply_(setAdd_, boundReceiptIds_, [receipt.payload.receiptId]);
      return binding;
    } catch (error) {
      return null;
    }
  }

  function isAuthenticatedTechnicalReceiptExecutionBinding_(binding, contract, plan, view, rde,
    sourceDocument, currentSubmissionContext) {
    try {
      const source = apply_(weakGet_, executionBindings_, [binding]);
      return !!source && isFrozen_(binding) && isFrozen_(sourceDocument) && source.contract === contract &&
        source.plan === plan && source.view === view && source.rde === rde &&
        source.sourceDocument === sourceDocument && source.currentSubmissionContext === currentSubmissionContext &&
        verifySignatureVerificationReceipt_(source.receipt, {
          currentSubmissionContext, rdeIdentity: binding.rdeIdentity, rdeDigest: binding.rdeDigest,
          sourceDocumentIdentity: binding.sourceDocumentIdentity,
          sourceDocumentDigest: binding.sourceDocumentDigest
        });
    } catch (error) {
      return false;
    }
  }

  Object.defineProperty(global, 'verifySignatureVerificationReceipt_', {
    value: verifySignatureVerificationReceipt_, enumerable: false,
    writable: false, configurable: false
  });
  Object.defineProperty(global, 'verifySignatureAdmissionProfile_', {
    value: verifySignatureAdmissionProfile_, enumerable: false,
    writable: false, configurable: false
  });
  Object.defineProperty(global, 'createTechnicalReceiptExecutionBinding_', {
    value: createTechnicalReceiptExecutionBinding_, enumerable: false,
    writable: false, configurable: false
  });
  Object.defineProperty(global, 'isAuthenticatedTechnicalReceiptExecutionBinding_', {
    value: isAuthenticatedTechnicalReceiptExecutionBinding_, enumerable: false,
    writable: false, configurable: false
  });
})(globalThis);
