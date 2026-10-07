/**
 * CBMSC HABITE-SE EXPERT
 * Apps Script - MVP operacional
 *
 * Arquitetura inicial:
 *
 * 00_ENTRADA
 *      ↓
 * scanInputFolder()
 *      ↓
 * identificação do arquivo
 *      ↓
 * PROCESS_ID determinístico
 *      ↓
 * registro persistente
 *      ↓
 * status NEW
 *
 * IMPORTANTE:
 * Neste estágio:
 * - nenhum documento é movido;
 * - nenhuma IA é executada;
 * - nenhuma análise normativa é realizada;
 * - nenhum PASS/FAIL é produzido.
 */

// Débito técnico: separar APP_VERSION, EXTRACTOR_VERSION, RDE_VERSION,
// ENGINE_VERSION e KNOWLEDGE_BASE_VERSION sem alterar o schema nesta etapa.
const APP_CONFIG = {
  APP_NAME: 'CBMSC Habite-se Expert',
  VERSION: '0.5.0',

  FOLDERS: {
    ROOT: {
      name: 'CBMSC_HABITESE',
      id: '10UhyLIZxwMe8PEDQti-2WEdDoUtEXxvL'
    },

    INPUT: {
      name: '00_ENTRADA',
      id: '1Lk7CbXq8Xp_Psck7FHKkmJYeHYtw6IpT'
    },

    PROCESSING: {
      name: '01_PROCESSANDO',
      id: '1kX8VwF5YKD6V3_fLdZPVuJZ4r7SMIhSk'
    },

    DONE: {
      name: '02_CONCLUIDOS',
      id: '1saqgDvw7w1W6W7BdIaHO_qIclLkeqCP-'
    },

    ERROR: {
      name: '03_ERROS',
      id: '1AT3Zo8ZK58X6x3bLTEbS3pz94EKIsohi'
    },

    CONFIG: {
      name: '99_CONFIG',
      id: '1eOEMI6MX8rZYVNksTcXviQc2NigT2G-Y'
    }
  },

  REGISTRY: {
    FILE_NAME: 'CBMSC_HABITESE_PROCESS_REGISTRY',
    SHEET_NAME: 'PROCESSOS'
  }
};

const PROCESS_STATUS = {
  NEW: 'NEW',
  INDEXED: 'INDEXED',
  EXTRACTION_PENDING: 'EXTRACTION_PENDING',
  EXTRACTED: 'EXTRACTED',
  VALIDATED: 'VALIDATED',
  ANALYZED: 'ANALYZED',
  REPORT_GENERATED: 'REPORT_GENERATED',
  DONE: 'DONE',
  ERROR: 'ERROR'
};

const REGISTRY_HEADERS = [
  'PROCESS_ID',
  'SOURCE_FILE_ID',
  'SOURCE_FILE_NAME',
  'MIME_TYPE',
  'SIZE_BYTES',
  'SOURCE_URL',
  'STATUS',
  'CREATED_AT',
  'UPDATED_AT',
  'SOURCE_CREATED_AT',
  'SOURCE_UPDATED_AT',
  'ENGINE_VERSION',
  'RDE_VERSION',
  'ERROR'
];

function doGet() {
  return HtmlService
    .createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <base target="_top">
          <meta charset="UTF-8">

          <title>
            CBMSC — Análise Documental de Habite-se
          </title>

          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              background: #f5f5f5;
            }

            .card {
              max-width: 900px;
              margin: auto;
              background: white;
              padding: 32px;
              border-radius: 12px;
              box-shadow:
                0 2px 10px rgba(0, 0, 0, .08);
            }

            h1 {
              margin-top: 0;
            }

            .status {
              padding: 12px;
              background: #eef6ee;
              border-radius: 8px;
            }

            .version {
              margin-top: 24px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>

        <body>
          <div class="card">

            <h1>
              CBMSC — Análise Documental de Habite-se
            </h1>

            <p>
              Plataforma experimental de sistema especialista
              para análise documental.
            </p>

            <div class="status">
              Backend Apps Script operacional.
            </div>

            <div class="version">
              Versão ${APP_CONFIG.VERSION}
            </div>

          </div>
        </body>
      </html>
    `)
    .setTitle(
      'CBMSC — Análise Documental de Habite-se'
    );
}

function configureProject() {

  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {

    const props =
      PropertiesService.getScriptProperties();

    validateFolder_(
      APP_CONFIG.FOLDERS.ROOT
    );

    validateFolder_(
      APP_CONFIG.FOLDERS.INPUT
    );

    validateFolder_(
      APP_CONFIG.FOLDERS.PROCESSING
    );

    validateFolder_(
      APP_CONFIG.FOLDERS.DONE
    );

    validateFolder_(
      APP_CONFIG.FOLDERS.ERROR
    );

    validateFolder_(
      APP_CONFIG.FOLDERS.CONFIG
    );

    props.setProperties({
      CBMSC_ROOT_FOLDER_ID:
        APP_CONFIG.FOLDERS.ROOT.id,

      CBMSC_INPUT_FOLDER_ID:
        APP_CONFIG.FOLDERS.INPUT.id,

      CBMSC_PROCESSING_FOLDER_ID:
        APP_CONFIG.FOLDERS.PROCESSING.id,

      CBMSC_DONE_FOLDER_ID:
        APP_CONFIG.FOLDERS.DONE.id,

      CBMSC_ERROR_FOLDER_ID:
        APP_CONFIG.FOLDERS.ERROR.id,

      CBMSC_CONFIG_FOLDER_ID:
        APP_CONFIG.FOLDERS.CONFIG.id,

      APP_VERSION:
        APP_CONFIG.VERSION
    });

    const registry =
      ensureRegistrySpreadsheet_();

    const result = {
      status: 'OK',
      appVersion: APP_CONFIG.VERSION,
      registrySpreadsheetId:
        registry.spreadsheet.getId(),
      registrySpreadsheetUrl:
        registry.spreadsheet.getUrl(),
      sheetName:
        registry.sheet.getName()
    };

    console.log(
      JSON.stringify(result, null, 2)
    );

    return result;

  } finally {

    lock.releaseLock();
  }
}

function testDriveAccess() {

  const result = {};

  Object.entries(
    APP_CONFIG.FOLDERS
  ).forEach(([key, config]) => {

    const folder =
      DriveApp.getFolderById(config.id);

    result[key] = {
      accessible: true,
      name: folder.getName(),
      id: folder.getId(),
      url: folder.getUrl()
    };
  });

  console.log(
    JSON.stringify(result, null, 2)
  );

  return result;
}

function scanInputFolder() {

  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {

    const inputFolder =
      DriveApp.getFolderById(
        APP_CONFIG.FOLDERS.INPUT.id
      );

    const registry =
      ensureRegistrySpreadsheet_();

    const sheet =
      registry.sheet;

    const existingFileIds =
      getRegisteredFileIds_(sheet);

    const files =
      inputFolder.getFiles();

    const newProcesses = [];

    let scannedFiles = 0;
    let skippedFiles = 0;

    while (files.hasNext()) {

      const file =
        files.next();

      scannedFiles++;

      const fileId =
        file.getId();

      if (
        existingFileIds.has(fileId)
      ) {
        skippedFiles++;
        continue;
      }

      const processId =
        makeProcessId_(fileId);

      const now =
        new Date();

      const row = [
        processId,
        fileId,
        file.getName(),
        file.getMimeType(),
        getFileSizeSafe_(file),
        file.getUrl(),

        PROCESS_STATUS.NEW,

        now,
        now,

        getFileDateSafe_(
          file,
          'created'
        ),

        getFileDateSafe_(
          file,
          'updated'
        ),

        APP_CONFIG.VERSION,

        '',

        ''
      ];

      sheet.appendRow(row);

      existingFileIds.add(fileId);

      newProcesses.push({
        processId: processId,
        fileId: fileId,
        fileName: file.getName(),
        status: PROCESS_STATUS.NEW
      });
    }

    const result = {
      status: 'OK',
      scannedFiles:
        scannedFiles,

      newProcesses:
        newProcesses.length,

      skippedFiles:
        skippedFiles,

      processes:
        newProcesses
    };

    console.log(
      JSON.stringify(result, null, 2)
    );

    return result;

  } catch (error) {

    console.error(
      'scanInputFolder ERROR: ' +
      error.stack
    );

    throw error;

  } finally {

    lock.releaseLock();
  }
}


/* ============================================================
 * INDEXAÇÃO DE PROCESSOS NEW
 * ============================================================
 */

/**
 * Transfere processos NEW para uma pasta própria em 01_PROCESSANDO
 * e altera o estado para INDEXED.
 *
 * Idempotência:
 * - processos que não estão em NEW são ignorados;
 * - a pasta do processo é reutilizada se já existir;
 * - se o arquivo já estiver na pasta do processo, não é movido novamente.
 */
function indexNewProcesses() {

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {

    const registry = ensureRegistrySpreadsheet_();
    const sheet = registry.sheet;
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return {
        status: 'OK',
        indexed: 0,
        skipped: 0,
        processes: []
      };
    }

    const values = sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        REGISTRY_HEADERS.length
      )
      .getValues();

    const processingRoot = DriveApp.getFolderById(
      APP_CONFIG.FOLDERS.PROCESSING.id
    );

    const indexed = [];
    let skipped = 0;

    values.forEach((row, index) => {

      const sheetRow = index + 2;
      const processId = String(row[0] || '').trim();
      const sourceFileId = String(row[1] || '').trim();
      const status = String(row[6] || '').trim();

      if (status !== PROCESS_STATUS.NEW) {
        skipped++;
        return;
      }

      if (!processId || !sourceFileId) {
        throw new Error(
          'Registro inválido na linha ' + sheetRow +
          ': PROCESS_ID ou SOURCE_FILE_ID ausente.'
        );
      }

      const processFolder = getOrCreateProcessFolder_(
        processingRoot,
        processId
      );

      const sourceFile = DriveApp.getFileById(sourceFileId);

      if (!fileHasParent_(sourceFile, processFolder.getId())) {
        sourceFile.moveTo(processFolder);
      }

      const now = new Date();

      sheet.getRange(sheetRow, 7).setValue(
        PROCESS_STATUS.INDEXED
      );

      sheet.getRange(sheetRow, 9).setValue(now);

      indexed.push({
        processId: processId,
        fileId: sourceFileId,
        processFolderId: processFolder.getId(),
        status: PROCESS_STATUS.INDEXED
      });
    });

    SpreadsheetApp.flush();

    const result = {
      status: 'OK',
      indexed: indexed.length,
      skipped: skipped,
      processes: indexed
    };

    console.log(
      JSON.stringify(result, null, 2)
    );

    return result;

  } finally {

    lock.releaseLock();
  }
}


/**
 * Prepara as pastas RDE dos processos INDEXED e os encaminha para
 * EXTRACTION_PENDING. Esta etapa não lê documentos nem executa extração.
 */
function prepareExtractionQueue() {

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {

    const registry = ensureRegistrySpreadsheet_();
    const sheet = registry.sheet;
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return {
        status: 'OK',
        prepared: 0,
        skipped: 0,
        processes: []
      };
    }

    const values = sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        REGISTRY_HEADERS.length
      )
      .getValues();

    const processingRoot = DriveApp.getFolderById(
      APP_CONFIG.FOLDERS.PROCESSING.id
    );

    const indexedProcesses = [];
    let skipped = 0;

    values.forEach((row, index) => {

      if (row[6] !== PROCESS_STATUS.INDEXED) {
        skipped++;
        return;
      }

      const processId = String(row[0] || '').trim();

      if (!processId) {
        throw new Error(
          'Registro INDEXED inválido na linha ' + (index + 2) +
          ': PROCESS_ID ausente.'
        );
      }

      const processFolders =
        processingRoot.getFoldersByName(processId);

      if (!processFolders.hasNext()) {
        throw new Error(
          'Pasta do processo ausente para PROCESS_ID: ' + processId
        );
      }

      const processFolder = processFolders.next();

      if (processFolders.hasNext()) {
        throw new Error(
          'Mais de uma pasta do processo encontrada para PROCESS_ID: ' +
          processId
        );
      }

      indexedProcesses.push({
        rowNumber: index + 2,
        processId: processId,
        processFolder: processFolder,
        createdAt: row[7]
      });
    });

    const preparedProcesses = indexedProcesses.map(process => {

      const rdeFolders =
        process.processFolder.getFoldersByName('RDE');

      let rdeFolder;

      if (rdeFolders.hasNext()) {
        rdeFolder = rdeFolders.next();

        if (rdeFolders.hasNext()) {
          throw new Error(
            'Mais de uma pasta RDE encontrada para PROCESS_ID: ' +
            process.processId
          );
        }
      } else {
        rdeFolder = process.processFolder.createFolder('RDE');
      }

      return {
        rowNumber: process.rowNumber,
        processId: process.processId,
        createdAt: process.createdAt,
        rdeFolderId: rdeFolder.getId()
      };
    });

    const now = new Date();

    preparedProcesses.forEach(process => {
      sheet
        .getRange(process.rowNumber, 7, 1, 3)
        .setValues([[
          PROCESS_STATUS.EXTRACTION_PENDING,
          process.createdAt,
          now
        ]]);
    });

    SpreadsheetApp.flush();

    const processes = preparedProcesses.map(process => ({
      processId: process.processId,
      rdeFolderId: process.rdeFolderId,
      status: PROCESS_STATUS.EXTRACTION_PENDING
    }));

    const result = {
      status: 'OK',
      prepared: processes.length,
      skipped: skipped,
      processes: processes
    };

    console.log(JSON.stringify(result, null, 2));

    return result;

  } finally {

    lock.releaseLock();
  }
}


/**
 * Gera RDEs vazias com o extrator fake determinístico para processos pendentes.
 * O conteúdo documental não é interpretado; os bytes são lidos apenas para SHA-256.
 */
function extractPendingProcessesFake() {

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {

    const registry = ensureRegistrySpreadsheet_();
    const sheet = registry.sheet;
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return {
        status: 'OK',
        extracted: 0,
        skipped: 0,
        processes: []
      };
    }

    const values = sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        REGISTRY_HEADERS.length
      )
      .getValues();

    const processingRoot = DriveApp.getFolderById(
      APP_CONFIG.FOLDERS.PROCESSING.id
    );

    const processes = [];
    const errors = [];
    let skipped = 0;

    values.forEach((row, index) => {

      if (row[6] !== PROCESS_STATUS.EXTRACTION_PENDING) {
        skipped++;
        return;
      }

      const sheetRow = index + 2;
      const processId = String(row[0] || '').trim();
      const sourceFileId = String(row[1] || '').trim();

      try {

        if (!processId) {
          throw new Error('PROCESS_ID ausente no registro.');
        }

        if (!sourceFileId) {
          throw new Error('SOURCE_FILE_ID ausente no registro.');
        }

        const processFolders =
          processingRoot.getFoldersByName(processId);

        if (!processFolders.hasNext()) {
          throw new Error(
            'Pasta do processo não encontrada: ' + processId
          );
        }

        const processFolder = processFolders.next();

        if (processFolders.hasNext()) {
          throw new Error(
            'Mais de uma pasta encontrada para PROCESS_ID: ' + processId
          );
        }

        const rdeFolders = processFolder.getFoldersByName('RDE');

        if (!rdeFolders.hasNext()) {
          throw new Error(
            'Pasta RDE não encontrada para PROCESS_ID: ' + processId
          );
        }

        const rdeFolder = rdeFolders.next();

        if (rdeFolders.hasNext()) {
          throw new Error(
            'Mais de uma pasta RDE encontrada para PROCESS_ID: ' + processId
          );
        }

        // DriveApp.getFileById valida a existência sem abrir o conteúdo.
        const sourceFile = DriveApp.getFileById(sourceFileId);

        if (sourceFile.getId() !== sourceFileId) {
          throw new Error(
            'SOURCE_FILE_ID não corresponde ao arquivo localizado.'
          );
        }

        // Os bytes são consumidos somente pelo algoritmo de hash, sem OCR ou parsing.
        const sourceSha256 = sha256Hex_(
          sourceFile.getBlob().getBytes()
        );

        const rdeFileName =
          'rde-v' + RDE_SCHEMA_VERSION + '.json';

        const rdeFiles = rdeFolder.getFilesByName(rdeFileName);
        let rdeFile;

        if (rdeFiles.hasNext()) {
          rdeFile = rdeFiles.next();

          if (rdeFiles.hasNext()) {
            throw new Error(
              'Mais de um arquivo ' + rdeFileName +
              ' encontrado para PROCESS_ID: ' + processId
            );
          }
        } else {
          const rde = buildFakeRde_({
            processId: processId,
            sourceFileId: sourceFileId,
            sourceFileName: sourceFile.getName(),
            sourceMimeType: sourceFile.getMimeType(),
            sourceUrl: sourceFile.getUrl(),
            sourceSha256: sourceSha256,
            createdAt: new Date().toISOString()
          });

          rdeFile = rdeFolder.createFile(
            rdeFileName,
            JSON.stringify(rde, null, 2),
            'application/json'
          );
        }

        if (rdeFile.getMimeType() !== 'application/json') {
          throw new Error(
            'MIME type do arquivo RDE deve ser application/json.'
          );
        }

        const savedContent = rdeFile
          .getBlob()
          .getDataAsString('UTF-8');

        parseAndValidateRdeJson_(savedContent, {
          processId: processId,
          sourceFileId: sourceFileId,
          sourceSha256: sourceSha256
        });

        // Atualiza STATUS, UPDATED_AT e RDE_VERSION juntos, preservando
        // as demais colunas do intervalo G:M e deixando ERROR intacto.
        const registryFields = row.slice(6, 13);
        registryFields[0] = PROCESS_STATUS.EXTRACTED;
        registryFields[2] = new Date();
        registryFields[6] = RDE_SCHEMA_VERSION;

        sheet
          .getRange(sheetRow, 7, 1, 7)
          .setValues([registryFields]);

        processes.push({
          processId: processId,
          rdeFileId: rdeFile.getId(),
          rdeVersion: RDE_SCHEMA_VERSION,
          status: PROCESS_STATUS.EXTRACTED
        });

      } catch (error) {

        const message = error && error.message
          ? error.message
          : String(error);

        const errorRecord = {
          processId: processId,
          message: message
        };

        errors.push(errorRecord);

        try {
          // Mantém o status e todas as outras colunas como estavam.
          const registryFields = row.slice(6, 14);
          registryFields[2] = new Date();
          registryFields[7] = message;

          sheet
            .getRange(sheetRow, 7, 1, 8)
            .setValues([registryFields]);
        } catch (registryError) {
          errorRecord.message +=
            ' Falha ao registrar ERROR/UPDATED_AT: ' +
            (registryError.message || String(registryError));
        }
      }
    });

    SpreadsheetApp.flush();

    const result = {
      status: 'OK',
      extracted: processes.length,
      skipped: skipped,
      processes: processes
    };

    if (errors.length) {
      result.errors = errors;
    }

    console.log(JSON.stringify(result, null, 2));

    return result;

  } finally {

    lock.releaseLock();
  }
}


/** Valida estrutura, rastreabilidade e hash das RDEs com status EXTRACTED. */
function validateExtractedProcesses() {

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {

    const registry = ensureRegistrySpreadsheet_();
    const sheet = registry.sheet;
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return {
        status: 'OK',
        validated: 0,
        skipped: 0,
        processes: [],
        errors: []
      };
    }

    const values = sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        REGISTRY_HEADERS.length
      )
      .getValues();

    const processingRoot = DriveApp.getFolderById(
      APP_CONFIG.FOLDERS.PROCESSING.id
    );

    const processes = [];
    const errors = [];
    let skipped = 0;

    values.forEach((row, index) => {

      if (row[6] !== PROCESS_STATUS.EXTRACTED) {
        skipped++;
        return;
      }

      const sheetRow = index + 2;
      const processId = String(row[0] || '').trim();
      const sourceFileId = String(row[1] || '').trim();

      try {

        if (!processId) {
          throw makeRdeValidationError_(
            'RDE_PROCESS_ID_MISSING',
            'PROCESS_ID ausente no registro.'
          );
        }

        if (!sourceFileId) {
          throw makeRdeValidationError_(
            'RDE_SOURCE_FILE_ID_MISSING',
            'SOURCE_FILE_ID ausente no registro.'
          );
        }

        if (row[12] !== RDE_SCHEMA_VERSION) {
          throw makeRdeValidationError_(
            'RDE_VERSION_MISMATCH',
            'RDE_VERSION do registro deve ser ' + RDE_SCHEMA_VERSION + '.'
          );
        }

        const processFolder = getUniqueValidationFolder_(
          processingRoot,
          processId,
          processId
        );

        const rdeFolder = getUniqueValidationFolder_(
          processFolder,
          'RDE',
          processId
        );

        const rdeFileName =
          'rde-v' + RDE_SCHEMA_VERSION + '.json';
        const rdeFiles = rdeFolder.getFilesByName(rdeFileName);

        if (!rdeFiles.hasNext()) {
          throw makeRdeValidationError_(
            'RDE_FILE_NOT_FOUND',
            'Arquivo ' + rdeFileName + ' não encontrado.'
          );
        }

        const rdeFile = rdeFiles.next();

        if (rdeFiles.hasNext()) {
          throw makeRdeValidationError_(
            'RDE_DUPLICATE_FILE',
            'Mais de um arquivo ' + rdeFileName + ' encontrado.'
          );
        }

        const rdeContent = rdeFile
          .getBlob()
          .getDataAsString('UTF-8');

        const rde = parseAndValidateOperationalRdeJson_(rdeContent, {
          processId: processId,
          sourceFileId: sourceFileId
        });

        let sourceFile;

        try {
          sourceFile = DriveApp.getFileById(sourceFileId);
        } catch (sourceError) {
          throw makeRdeValidationError_(
            'RDE_SOURCE_FILE_NOT_FOUND',
            'Documento-fonte não encontrado pelo SOURCE_FILE_ID.'
          );
        }

        const actualSourceHash = sha256Hex_(
          sourceFile.getBlob().getBytes()
        );

        validateSourceHash_(rde.source.sha256, actualSourceHash);

        // A validação terminou; atualiza status, data e limpa ERROR juntos.
        const registryFields = row.slice(6, 14);
        registryFields[0] = PROCESS_STATUS.VALIDATED;
        registryFields[2] = new Date();
        registryFields[7] = '';

        sheet
          .getRange(sheetRow, 7, 1, 8)
          .setValues([registryFields]);

        processes.push({
          processId: processId,
          rdeFileId: rdeFile.getId(),
          rdeVersion: RDE_SCHEMA_VERSION,
          status: PROCESS_STATUS.VALIDATED
        });

      } catch (error) {

        const code = error && error.code
          ? error.code
          : 'RDE_VALIDATION_ERROR';
        const message = error && error.message
          ? error.message
          : String(error);

        const errorRecord = {
          processId: processId,
          code: code,
          message: message
        };

        errors.push(errorRecord);

        try {
          // Mantém EXTRACTED e as demais colunas; só registra erro e data.
          const registryFields = row.slice(6, 14);
          registryFields[2] = new Date();
          registryFields[7] = code + ': ' + message;

          sheet
            .getRange(sheetRow, 7, 1, 8)
            .setValues([registryFields]);
        } catch (registryError) {
          errorRecord.message +=
            ' Falha ao registrar ERROR/UPDATED_AT: ' +
            (registryError.message || String(registryError));
        }
      }
    });

    SpreadsheetApp.flush();

    const result = {
      status: 'OK',
      validated: processes.length,
      skipped: skipped,
      processes: processes,
      errors: errors
    };

    console.log(JSON.stringify(result, null, 2));

    return result;

  } finally {

    lock.releaseLock();
  }
}


function getUniqueValidationFolder_(parentFolder, folderName, processId) {

  const folders = parentFolder.getFoldersByName(folderName);

  if (!folders.hasNext()) {
    throw makeRdeValidationError_(
      'RDE_FOLDER_NOT_FOUND',
      'Pasta "' + folderName + '" não encontrada para PROCESS_ID: ' + processId
    );
  }

  const folder = folders.next();

  if (folders.hasNext()) {
    throw makeRdeValidationError_(
      'RDE_DUPLICATE_FOLDER',
      'Mais de uma pasta "' + folderName + '" encontrada para PROCESS_ID: ' +
      processId
    );
  }

  return folder;
}


function getOrCreateProcessFolder_(
  processingRoot,
  processId
) {

  const folders =
    processingRoot.getFoldersByName(processId);

  if (folders.hasNext()) {
    return folders.next();
  }

  return processingRoot.createFolder(
    processId
  );
}


function fileHasParent_(
  file,
  folderId
) {

  const parents =
    file.getParents();

  while (parents.hasNext()) {

    if (
      parents.next().getId() === folderId
    ) {
      return true;
    }
  }

  return false;
}


function listProcesses() {

  const registry =
    ensureRegistrySpreadsheet_();

  const sheet =
    registry.sheet;

  const lastRow =
    sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const values =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        REGISTRY_HEADERS.length
      )
      .getValues();

  const processes =
    values.map(row => {

      const item = {};

      REGISTRY_HEADERS.forEach(
        (header, index) => {
          item[header] =
            row[index];
        }
      );

      return item;
    });

  console.log(
    JSON.stringify(
      processes,
      null,
      2
    )
  );

  return processes;
}

/**
 * Read-only preparation diagnostic for one VALIDATED process.
 * It never executes Criteria, writes artifacts, or advances the workflow status.
 */
function prepareValidatedProcessExecutionReadiness(
  processId,
  currentSubmissionContext
) {

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    return prepareValidatedExecutionReadiness(
      processId,
      currentSubmissionContext,
      {
        withLock: function (callback) {
          return callback();
        },
        readProcess: function (requestedProcessId) {
          const sheet = getExistingRegistrySheet_();
          const lastRow = sheet.getLastRow();
          if (lastRow <= 1) return null;

          const rows = sheet.getRange(
            2, 1, lastRow - 1, REGISTRY_HEADERS.length
          ).getValues();
          const matches = rows.filter(row =>
            String(row[0] || '').trim() === requestedProcessId
          );
          if (matches.length !== 1) {
            if (matches.length === 0) return null;
            throw makeRdeValidationError_(
              'PROCESS_REGISTRY_DUPLICATE',
              'Mais de um registro encontrado para PROCESS_ID: ' + requestedProcessId
            );
          }
          return {
            processId: String(matches[0][0] || '').trim(),
            sourceFileId: String(matches[0][1] || '').trim(),
            status: String(matches[0][6] || '').trim(),
          };
        },
        readValidatedRde: function (processRecord) {
          const processingRoot = DriveApp.getFolderById(
            APP_CONFIG.FOLDERS.PROCESSING.id
          );
          const processFolder = getUniqueValidationFolder_(
            processingRoot, processRecord.processId, processRecord.processId
          );
          const rdeFolder = getUniqueValidationFolder_(
            processFolder, 'RDE', processRecord.processId
          );
          const fileName = 'rde-v' + RDE_SCHEMA_VERSION + '.json';
          const files = rdeFolder.getFilesByName(fileName);
          if (!files.hasNext()) {
            throw makeRdeValidationError_(
              'RDE_MISSING', 'Arquivo RDE validado não encontrado: ' + fileName
            );
          }
          const file = files.next();
          if (files.hasNext()) {
            throw makeRdeValidationError_(
              'RDE_DUPLICATE_FILE', 'Mais de um arquivo RDE validado encontrado.'
            );
          }
          return file.getBlob().getDataAsString('UTF-8');
        },
      }
    );
  } finally {
    lock.releaseLock();
  }
}

/** Finds the existing registry without creating, repairing, or changing it. */
function getExistingRegistrySheet_() {
  const props = PropertiesService.getScriptProperties();
  const storedId = props.getProperty('PROCESS_REGISTRY_SPREADSHEET_ID');
  let spreadsheet = null;

  if (storedId) {
    spreadsheet = SpreadsheetApp.openById(storedId);
  } else {
    const configFolder = DriveApp.getFolderById(APP_CONFIG.FOLDERS.CONFIG.id);
    const files = configFolder.getFilesByName(APP_CONFIG.REGISTRY.FILE_NAME);
    if (!files.hasNext()) {
      throw makeRdeValidationError_(
        'PROCESS_REGISTRY_NOT_FOUND', 'Registry existente não foi encontrado.'
      );
    }
    const file = files.next();
    if (files.hasNext()) {
      throw makeRdeValidationError_(
        'PROCESS_REGISTRY_DUPLICATE', 'Mais de um registry existente foi encontrado.'
      );
    }
    spreadsheet = SpreadsheetApp.openById(file.getId());
  }

  const sheet = spreadsheet.getSheetByName(APP_CONFIG.REGISTRY.SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 1 ||
      sheet.getRange(1, 1, 1, REGISTRY_HEADERS.length).getValues()[0]
        .some((value, index) => value !== REGISTRY_HEADERS[index])) {
    throw makeRdeValidationError_(
      'PROCESS_REGISTRY_INVALID', 'Registry existente tem cabeçalho incompatível.'
    );
  }
  return sheet;
}

function makeProcessId_(fileId) {

  const digest =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      fileId,
      Utilities.Charset.UTF_8
    );

  const hex =
    digest
      .map(byte => {
        const value =
          (byte + 256) % 256;

        return value
          .toString(16)
          .padStart(2, '0');
      })
      .join('');

  return (
    'HAB-' +
    hex
      .substring(0, 16)
      .toUpperCase()
  );
}

function ensureRegistrySpreadsheet_() {

  const props =
    PropertiesService.getScriptProperties();

  let spreadsheet = null;

  const storedId =
    props.getProperty(
      'PROCESS_REGISTRY_SPREADSHEET_ID'
    );

  if (storedId) {

    try {

      spreadsheet =
        SpreadsheetApp.openById(
          storedId
        );

    } catch (error) {

      console.warn(
        'Registro configurado anteriormente ' +
        'não pôde ser aberto: ' +
        error.message
      );
    }
  }

  if (!spreadsheet) {

    const configFolder =
      DriveApp.getFolderById(
        APP_CONFIG.FOLDERS.CONFIG.id
      );

    const files =
      configFolder.getFilesByName(
        APP_CONFIG.REGISTRY.FILE_NAME
      );

    if (files.hasNext()) {

      const file =
        files.next();

      spreadsheet =
        SpreadsheetApp.openById(
          file.getId()
        );
    }
  }

  if (!spreadsheet) {

    spreadsheet =
      SpreadsheetApp.create(
        APP_CONFIG.REGISTRY.FILE_NAME
      );

    const spreadsheetFile =
      DriveApp.getFileById(
        spreadsheet.getId()
      );

    const configFolder =
      DriveApp.getFolderById(
        APP_CONFIG.FOLDERS.CONFIG.id
      );

    spreadsheetFile.moveTo(
      configFolder
    );
  }

  props.setProperty(
    'PROCESS_REGISTRY_SPREADSHEET_ID',
    spreadsheet.getId()
  );

  let sheet =
    spreadsheet.getSheetByName(
      APP_CONFIG.REGISTRY.SHEET_NAME
    );

  if (!sheet) {

    sheet =
      spreadsheet.insertSheet(
        APP_CONFIG.REGISTRY.SHEET_NAME
      );
  }

  const sheets =
    spreadsheet.getSheets();

  sheets.forEach(item => {

    if (
      item.getName() !==
        APP_CONFIG.REGISTRY.SHEET_NAME &&
      item.getLastRow() === 0 &&
      spreadsheet.getSheets().length > 1
    ) {

      spreadsheet.deleteSheet(
        item
      );
    }
  });

  ensureRegistryHeaders_(
    sheet
  );

  return {
    spreadsheet:
      spreadsheet,

    sheet:
      sheet
  };
}

function ensureRegistryHeaders_(sheet) {

  const lastColumn =
    sheet.getLastColumn();

  const lastRow =
    sheet.getLastRow();

  if (
    lastRow === 0 ||
    lastColumn === 0
  ) {

    sheet
      .getRange(
        1,
        1,
        1,
        REGISTRY_HEADERS.length
      )
      .setValues([
        REGISTRY_HEADERS
      ]);

    sheet.setFrozenRows(1);

    return;
  }

  const currentHeaders =
    sheet
      .getRange(
        1,
        1,
        1,
        Math.max(
          lastColumn,
          REGISTRY_HEADERS.length
        )
      )
      .getValues()[0];

  const expected =
    REGISTRY_HEADERS.join('|');

  const actual =
    currentHeaders
      .slice(
        0,
        REGISTRY_HEADERS.length
      )
      .join('|');

  if (expected !== actual) {

    throw new Error(
      'Schema inesperado na planilha ' +
      'de registro. Não foi realizada ' +
      'alteração automática.'
    );
  }
}

function getRegisteredFileIds_(sheet) {

  const ids =
    new Set();

  const lastRow =
    sheet.getLastRow();

  if (lastRow <= 1) {
    return ids;
  }

  const values =
    sheet
      .getRange(
        2,
        2,
        lastRow - 1,
        1
      )
      .getValues();

  values.forEach(row => {

    const value =
      String(
        row[0] || ''
      ).trim();

    if (value) {
      ids.add(value);
    }
  });

  return ids;
}

function validateFolder_(config) {

  const folder =
    DriveApp.getFolderById(
      config.id
    );

  if (
    folder.getName() !==
    config.name
  ) {

    throw new Error(
      'Inconsistência de configuração. ' +
      'ID esperado para "' +
      config.name +
      '" aponta para a pasta "' +
      folder.getName() +
      '".'
    );
  }

  return folder;
}

function getFileSizeSafe_(file) {

  try {
    return file.getSize();
  } catch (error) {
    return '';
  }
}

function getFileDateSafe_(
  file,
  field
) {

  try {

    if (field === 'created') {
      return file.getDateCreated();
    }

    if (field === 'updated') {
      return file.getLastUpdated();
    }

  } catch (error) {

    return '';
  }

  return '';
}
