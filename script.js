document.addEventListener('DOMContentLoaded', () => {
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
    const file = fileInput.files[0];
    if (!file) {
      generateBtn.disabled = true;
      return;
    }

    const validExtensions = ['.txt', '.pdf', '.docx'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();

    if (validExtensions.includes(fileExt)) {
      generateBtn.disabled = false;
      console.log('✅ Archivo válido:', file.name);
    } else {
      alert('❌ Formato no soportado. Usa .txt, .pdf o .docx');
      fileInput.value = '';
      generateBtn.disabled = true;
    }
  });

  // Generar examen
  generateBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    examContainer.innerHTML = '<p>🔄 Procesando archivo...</p>';

    try {
      if (file.name.endsWith('.txt')) {
        fullText = await readFileAsText(file);
      }
      else if (file.name.endsWith('.pdf')) {
        fullText = await extractTextFromPDF(file);
      }
      else if (file.name.endsWith('.docx')) {
        fullText = await extractTextFromDocx(file);
      }
      else {
        throw new Error('Formato no soportado');
      }

      if (fullText.trim().length < 50) {
        examContainer.innerHTML = '<p>❌ El archivo está vacío o no tiene suficiente texto.</p>';
        return;
      }

      console.log('📄 Texto extraído:', fullText.substring(0, 200) + '...');
      const exam = generateExam(fullText);
      displayInteractiveExam(exam);
      exportBtn.style.display = 'inline-block';
    }
    catch (error) {
      console.error('❌ Error:', error);
      examContainer.innerHTML = `<p style="color:red;">❌ Error: ${error.message}</p>`;
    }
  });

  // Exportar a PDF
  exportBtn.addEventListener('click', () => {
    if (typeof html2pdf !== 'undefined') {
      const opt = {
        margin: 1,
        filename: 'examen_generado.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      html2pdf().from(examContainer).set(opt).save();
    } else {
      alert('⚠️ Exportar a PDF no disponible.');
    }
  });

  // === FUNCIONES DE LECTURA ===
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsText(file);
    });
  }

  async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({  arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      text += ' ' + pageText;
    }
    return text;
  }

  async function extractTextFromDocx(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        mammoth.extractText({ arrayBuffer })
          .then(result => resolve(result.text))
          .catch(err => reject(new Error('Error al leer .docx: ' + err.message)));
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo .docx'));
      reader.readAsArrayBuffer(file);
    });
  }

  // === GENERAR EXAMEN ===
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
      const type = types.length > 0 ? types[Math.floor(Math.random() * types.length)] : 'mcq';

      if (type === 'mcq') {
        const keyword = words[Math.floor(Math.random() * words.length)] || 'palabra';
        const options = [
          keyword,
          keyTerms[Math.floor(Math.random() * keyTerms.length)] || 'Opción 1',
          key
