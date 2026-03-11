import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SITE_URL = 'https://torneiofacil.com/';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_PDF = path.resolve('torneios-torneiofacil.pdf');

function decodeJsString(value) {
  return value.replace(/\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|["'\\nrtbfv0])/g, (_, token) => {
    if (token.startsWith('x')) {
      return String.fromCharCode(parseInt(token.slice(1), 16));
    }

    if (token.startsWith('u')) {
      return String.fromCharCode(parseInt(token.slice(1), 16));
    }

    const escapes = {
      '"': '"',
      "'": "'",
      '\\': '\\',
      n: '\n',
      r: '\r',
      t: '\t',
      b: '\b',
      f: '\f',
      v: '\v',
      0: '\0',
    };

    return escapes[token] ?? token;
  });
}

function extractBundlePath(html) {
  const match = html.match(/<script defer="defer" src="([^"]*main[^"]*\.js)"/i);
  if (!match) {
    throw new Error('Nao foi possivel localizar o bundle principal no HTML.');
  }

  return new URL(match[1], SITE_URL).toString();
}

function extractTournaments(bundle) {
  const regex = /\{id:(\d+),title:"((?:\\.|[^"])*)",link:"((?:\\.|[^"])*)"/g;
  const seen = new Set();
  const tournaments = [];

  for (const match of bundle.matchAll(regex)) {
    const item = {
      id: Number(match[1]),
      title: decodeJsString(match[2]),
      link: decodeJsString(match[3]),
      url: `https://torneiofacil.com/tournament/${decodeJsString(match[3])}`,
    };
    const key = `${item.id}|${item.link}`;

    if (!seen.has(key)) {
      seen.add(key);
      tournaments.push(item);
    }
  }

  if (tournaments.length === 0) {
    throw new Error('Nenhum torneio foi encontrado no bundle.');
  }

  return tournaments;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(tournaments) {
  const generatedAt = new Date().toLocaleString('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  });

  const rows = tournaments
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.id}</td>
          <td>${escapeHtml(item.title)}</td>
          <td><a href="${item.url}">${escapeHtml(item.url)}</a></td>
        </tr>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Torneios Torneio Facil</title>
    <style>
      @page { size: A4; margin: 14mm; }
      body {
        font-family: Arial, sans-serif;
        color: #1f2937;
        margin: 0;
      }
      h1 {
        font-size: 22px;
        margin: 0 0 6px;
      }
      p {
        margin: 0 0 12px;
        font-size: 12px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }
      th, td {
        border: 1px solid #d1d5db;
        padding: 6px 8px;
        font-size: 11px;
        text-align: left;
        vertical-align: top;
        word-break: break-word;
      }
      th {
        background: #111827;
        color: white;
      }
      td:nth-child(1) { width: 6%; }
      td:nth-child(2) { width: 7%; }
      td:nth-child(3) { width: 32%; }
      td:nth-child(4) { width: 55%; }
      a {
        color: #0f766e;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <h1>59 torneios do Torneio Facil</h1>
    <p>Gerado em ${escapeHtml(generatedAt)} a partir de ${SITE_URL}</p>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>ID</th>
          <th>Torneio</th>
          <th>URL</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </body>
</html>`;
}

async function main() {
  const homeHtml = await fetch(SITE_URL).then((response) => response.text());
  const bundleUrl = extractBundlePath(homeHtml);
  const bundle = await fetch(bundleUrl).then((response) => response.text());
  const tournaments = extractTournaments(bundle);
  const html = buildHtml(tournaments);
  const htmlPath = path.join(tmpdir(), 'torneios-torneiofacil.html');

  writeFileSync(htmlPath, html, 'utf8');

  execFileSync(
    CHROME_PATH,
    [
      '--headless=new',
      '--disable-gpu',
      `--print-to-pdf=${OUTPUT_PDF}`,
      htmlPath,
    ],
    { stdio: 'ignore' },
  );

  console.log(`PDF gerado em: ${OUTPUT_PDF}`);
  console.log(`Total de torneios: ${tournaments.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
