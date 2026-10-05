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

const APP_CONFIG = {
  APP_NAME: 'CBMSC Habite-se Expert',
  VERSION: '0.1.0',

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
