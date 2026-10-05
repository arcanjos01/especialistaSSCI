function doGet() {
  return HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <meta charset="UTF-8">
        <title>CBMSC — Análise de Habite-se</title>
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
            box-shadow: 0 2px 10px rgba(0,0,0,.08);
          }

          h1 {
            margin-top: 0;
          }

          .status {
            padding: 12px;
            background: #eef6ee;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>CBMSC — Análise Documental de Habite-se</h1>

          <p>
            Plataforma experimental de sistema especialista
            para análise documental.
          </p>

          <div class="status">
            Interface do Apps Script funcionando.
          </div>
        </div>
      </body>
    </html>
  `);
}
