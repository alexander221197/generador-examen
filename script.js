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
  const file = fileInput.files[0];
  generateBtn.disabled = !file || !file.name.endsWith('.txt');
  
  if (file && !file.name.endsWith('.txt')) {
    alert('Por ahora, solo se soportan archivos .txt');
    fileInput.value = '';
  }
});

// Generar examen
generateBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  examContainer.innerHTML = '<p>Procesando texto...</p>';

  try {
    const text = await readFileAsText(file);
    
    if (text.trim().length < 50) {
      examContainer.innerHTML = '<p>El archivo está vacío o muy corto.</p>';
      return;
    }

    fullText = text;
    const exam = generateExam(text);
    displayInteractiveExam(exam);
    exportBtn.style.display = 'inline-block';
  } catch (error) {
    examContainer.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
  }
});

// Exportar a PDF (si html2pdf está disponible, si no, muestra advertencia)
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
    alert('Función de exportar a PDF no disponible en esta versión.');
  }
});

// Leer archivo .txt
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsText(file);
  });
}

// Generar examen (opción múltiple, verdadero/falso, respuesta corta)
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
          list.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
          li.classList.add('selected');
        });
        list.appendChild(li);
      });
      qDiv.appendChild(list);
    }

    else if (q.type === 'tf') {
      const list = document.createElement('ul');
      list.className = 'options';
      ['Verdadero', 'Falso'].forEach(opt => {
        const li = document.createElement('li');
        li.textContent = opt;
        li.dataset.correct = (opt === 'Verdadero') === q.correct;
        li.addEventListener('click', () => {
          list.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
          li.classList.add('selected');
        });
        list.appendChild(li);
      });
      qDiv.appendChild(list);
    }

    else if (q.type === 'short') {
      const shortDiv = document.createElement('div');
      shortDiv.className = 'short-answer';
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Escribe tu respuesta aquí...';
      input.dataset.correct = q.correct;
      shortDiv.appendChild(input);

      const btn = document.createElement('button');
      btn.textContent = 'Verificar';
      btn.className = 'btn-submit';
      btn.onclick = () => {
        const userAnswer = input.value.trim().toLowerCase();
        const correctAnswer = q.correct.toLowerCase();
        const feedback = document.createElement('div');
        feedback.className = 'feedback';
        if (userAnswer === correctAnswer) {
          feedback.textContent = '✅ Correcto';
          feedback.style.color = 'green';
        } else {
          feedback.textContent = `❌ Incorrecto. Respuesta correcta: "${q.correct}"`;
          feedback.style.color = 'red';
        }
        if (input.nextSibling) input.parentNode.removeChild(input.nextSibling);
        shortDiv.appendChild(feedback);
      };
      shortDiv.appendChild(btn);
      qDiv.appendChild(shortDiv);
    }

    examContainer.appendChild(qDiv);
  });

  const gradeBtn = document.createElement('button');
  gradeBtn.textContent = 'Calificar Examen';
  gradeBtn.style.marginTop = '20px';
  gradeBtn.onclick = () => gradeExam(questions);
  examContainer.appendChild(gradeBtn);

  const resultDiv = document.createElement('div');
  resultDiv.className = 'result';
  resultDiv.id = 'result';
  examContainer.appendChild(resultDiv);
}

// Calificar examen
function gradeExam(questions) {
  let correct = 0;
  document.querySelectorAll('.question').forEach((qDiv, index) => {
    const q = questions[index];
    if (q.type === 'mcq' || q.type === 'tf') {
      const selected = qDiv.querySelector('.options li.selected');
      if (selected && selected.dataset.correct === 'true') {
        correct++;
        selected.classList.add('correct');
      } else if (selected) {
        selected.classList.add('incorrect');
      }
      qDiv.querySelectorAll('li').forEach(li => {
        if (li.dataset.correct === 'true') li.classList.add('correct');
      });
    }
  });

  const resultDiv = document.getElementById('result');
  resultDiv.style.display = 'block';
  resultDiv.textContent = `Has acertado ${correct} de ${questions.length} preguntas.`;
}
