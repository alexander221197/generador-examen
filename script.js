// Elementos del DOM
const fileInput = document.getElementById('fileInput');
const generateBtn = document.getElementById('generateBtn');
const exportBtn = document.getElementById('exportBtn');
const examContainer = document.getElementById('examContainer');

const mcqCheck = document.getElementById('mcqCheck');
const tfCheck = document.getElementById('tfCheck');
const shortCheck = document.getElementById('shortCheck');

let fullText = '';

// Habilitar botón al subir archivo
fileInput.addEventListener('change', () => {
  generateBtn.disabled = fileInput.files.length === 0;
});

// Generar examen al hacer clic
generateBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  examContainer.innerHTML = '<p>Procesando archivo...</p>';

  try {
    if (file.type === 'application/pdf') {
      fullText = await extractTextFromPDF(file);
    } else if (file.name.endsWith('.docx')) {
      fullText = await extractTextFromDocx(file);
    } else {
      fullText = await readFileAsText(file);
    }

    if (fullText.trim().length < 50) {
      examContainer.innerHTML = '<p>El archivo está vacío o no tiene suficiente texto.</p>';
      return;
    }

    const exam = generateExam(fullText);
    displayInteractiveExam(exam);
    exportBtn.style.display = 'inline-block';
  } catch (error) {
    examContainer.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
  }
});

// Exportar a PDF
exportBtn.addEventListener('click', () => {
  const opt = {
    margin: 1,
    filename: 'examen_generado.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().from(examContainer).set(opt).save();
});

// Leer archivo de texto
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsText(file);
  });
}

// Extraer texto de PDF
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    text += ' ' + pageText;
  }
  return text;
}

// Extraer texto de .docx
async function extractTextFromDocx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const arrayBuffer = e.target.result;
      mammoth.extractText({ arrayBuffer: arrayBuffer })
        .then(result => resolve(result.text))
        .catch(reject);
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo .docx"));
    reader.readAsArrayBuffer(file);
  });
}

// Generar preguntas
function generateExam(text) {
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  const words = text.split(/\s+/).filter(w => w.length > 4);
  const keyTerms = [...new Set(words)].slice(0, 20);

  const questions = [];
  const numQuestions = Math.min(6, sentences.length);

  for (let i = 0; i < numQuestions; i++) {
    const sentence = sentences[i];
    const types = [];
    if (mcqCheck.checked) types.push('mcq');
    if (tfCheck.checked) types.push('tf');
    if (shortCheck.checked) types.push('short');
    if (types.length === 0) types.push('mcq');

    const type = types[Math.floor(Math.random() * types.length)];

    if (type === 'mcq') {
      const keyword = words[Math.floor(Math.random() * words.length)] || 'palabra';
      const options = [
        keyword,
        keyTerms[Math.floor(Math.random() * keyTerms.length)] || 'Opción 1',
        keyTerms[Math.floor(Math.random() * keyTerms.length)] || 'Opción 2',
        keyTerms[Math.floor(Math.random() * keyTerms.length)] || 'Opción 3'
      ].sort(() => 0.5 - Math.random());

      questions.push({
        type: 'mcq',
        question: `¿Qué palabra completa mejor: "${sentence.replace(/\b\w{4,}\b/, '__________')}"?`,
        options,
        correct: keyword
      });
    }

    else if (type === 'tf') {
      const isTrue = Math.random() < 0.7;
      const statement = isTrue ? sentence : `Falso: ${sentence.split(' ').reverse().join(' ')}`;
      questions.push({
        type: 'tf',
        question: statement,
        correct: isTrue
      });
    }

    else if (type === 'short') {
      const blanks = sentence.split(' ');
      const idx = Math.floor(Math.random() * blanks.length);
      const answer = blanks[idx];
      const prompt = blanks.map((w, i) => i === idx ? '__________' : w).join(' ');

      questions.push({
        type: 'short',
        question: `Complete: "${prompt}"`,
        correct: answer
      });
    }
  }

  return questions;
}

// Mostrar examen interactivo
function displayInteractiveExam(questions) {
  examContainer.innerHTML = '';
  const title = document.createElement('h2');
  title.textContent = '📝 Examen Interactivo';
  examContainer.appendChild(title);

  questions.forEach((q, index) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'question';

    const h3 = document.createElement('h3');
    h3.textContent = `${index + 1}. ${q.question}`;
    qDiv.appendChild(h3);

    if (q.type === 'mcq') {
      const list = document.createElement('ul');
      list.className = 'options';
      q.options.forEach(option => {
        const li = document.createElement('li');
        li.textContent = option;
        li.dataset.correct = option === q.correct;
        li.addEventListener('click', () => {
          list.querySelectorAll('li').forEach(el => el.classList

