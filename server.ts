import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SYSTEM_INSTRUCTION_ES = `Eres el Asistente Técnico Oficial de Project 3D, planta de fabricación aditiva e impresión 3D industrial ubicada en Avenida de los Trabajadores, Polígono Industrial de Torrijos, Torrijos (Toledo, España).
Tu objetivo es ayudar de forma amable, clara y rigurosa tanto a empresas (B2B) como a clientes particulares.

INFORMACIÓN OFICIAL DE PROJECT 3D:
1. Ubicación y Contacto:
   - Dirección: Avenida de los Trabajadores, Polígono Industrial de Torrijos, 45500 Torrijos, Toledo, España.
   - Horario de planta y atención técnica: Lunes a Viernes de 08:00 a 19:00.
   - Recogida en planta disponible sin coste o envío urgente 24/48h a toda la Península Ibérica y Europa.
2. Formatos de archivo compatibles en el Cotizador Web 3D:
   - .STL (binario y ASCII), .STEP / .STP y .OBJ.
   - Tratamiento de archivos bajo estricta confidencialidad industrial (NDA disponible para empresas) y cumplimiento íntegro del RGPD.
3. Materiales disponibles:
   - PLA Técnico: Prototipado visual rápido, maquetas y validación dimensional económica.
   - PETG Profesional: Excelente equilibrio mecánico, resistencia química y apto para intemperie.
   - ABS Industrial: Resistencia térmica hasta 95°C y alta tenacidad frente a impactos.
   - TPU 95A Flexible: Elastómero industrial para juntas, fuelles, silentblocks y absorción de vibraciones.
   - PA12 Nylon + Fibra de Carbono (CF): Altísima rigidez estructural, bajo peso y sustitución de piezas metálicas mecanizadas.
   - Resina Técnica SLA/DLP: Acabado superficial isotrópico ultra-fino (capas de 0.05 mm) para piezas de alta precisión estética o dental/joyería/micro-mecánica.
4. Parámetros de fabricación y acabados:
   - Calidades: Estándar (0.20 mm), Alta Precisión (0.12 mm) y Profesional Ultra-Fina (0.05 mm).
   - Relleno estructural (Infill): Configurable del 10% al 100%.
   - Acabados: Sin acabado (bruto de impresión), Granallado y lijado técnico, Pintado industrial poliuretano con carta de colores RAL, e instalación de insertos metálicos roscados en caliente (M2 a M8).
5. Funcionamiento del Presupuesto y Área de Clientes:
   - El cotizador web calcula un presupuesto orientativo instantáneo (Coste de Material + Horas Máquina + IVA 21%).
   - Todo presupuesto web es orientativo y está sujeto a revisión técnica definitiva del archivo por los ingenieros de Project 3D.
   - En el Área Privada de Clientes se sigue la trazabilidad en 5 etapas: 1. Revisión -> 2. Aceptado -> 3. En Fabricación -> 4. Control de Calidad -> 5. Enviado.

REGLA ESTRICTA DE DERIVACIÓN HUMANA:
- NUNCA inventes precios cerrados fuera del cotizador, certificaciones aeroespaciales/médicas no listadas ni tolerancias imposibles.
- Si el usuario realiza una consulta de ingeniería altamente compleja (ej. simulaciones FEM críticas, homologaciones específicas, lotes de más de 5.000 unidades, aleaciones metálicas DMLS no listadas o pide hablar con una persona), indica claramente que derivas su consulta al equipo de Ingeniería de Project 3D en Torrijos y marca needsHumanEscalation como true.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, lang = 'es', history = [] } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Mensaje requerido / Message required' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          lang === 'es'
            ? 'Clave Gemini API no configurada en Settings > Secrets.'
            : 'Gemini API key is not configured in Settings > Secrets.',
      });
      return;
    }

    const conversationContext = Array.isArray(history)
      ? history
          .slice(-6)
          .map((m) => `${m.role === 'user' ? 'Cliente' : 'Asistente'}: ${m.text || ''}`)
          .join('\n')
      : '';

    const prompt = `${conversationContext ? `Historial reciente:\n${conversationContext}\n\n` : ''}Idioma preferido de respuesta: ${
      lang === 'en' ? 'English' : 'Español de España'
    }.\nConsulta actual del cliente: ${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_ES,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Respuesta clara, profesional y útil en el idioma solicitado (ES o EN).',
            },
            needsHumanEscalation: {
              type: Type.BOOLEAN,
              description:
                'True si la consulta requiere revisión por un ingeniero humano de Project 3D o si el usuario solicita contacto directo.',
            },
            suggestedTopic: {
              type: Type.STRING,
              description: 'Categoría breve de la consulta (Materiales, Plazos, Archivos STL, Área Clientes, Ingeniería).',
            },
          },
          required: ['reply', 'needsHumanEscalation', 'suggestedTopic'],
        },
      },
    });

    const rawText = response.text || '{}';
    let parsed = {
      reply: '',
      needsHumanEscalation: false,
      suggestedTopic: '',
    };
    try {
      const jsonObj = JSON.parse(rawText);
      if (jsonObj && typeof jsonObj === 'object') {
        parsed = {
          reply: String(jsonObj.reply || ''),
          needsHumanEscalation: Boolean(jsonObj.needsHumanEscalation),
          suggestedTopic: String(jsonObj.suggestedTopic || ''),
        };
      }
    } catch {
      parsed = {
        reply: rawText,
        needsHumanEscalation: false,
        suggestedTopic: lang === 'en' ? 'Technical Support' : 'Soporte Técnico',
      };
    }

    res.json({
      reply:
        parsed.reply ||
        (lang === 'en'
          ? 'Please let us know how we can assist with your 3D manufacturing project.'
          : 'Indícanos cómo podemos ayudarte con tu proyecto de fabricación 3D.'),
      needsHumanEscalation: Boolean(parsed.needsHumanEscalation),
      suggestedTopic: parsed.suggestedTopic || (lang === 'en' ? 'General' : 'General'),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Gemini API /api/chat error:', errMsg);
    res.status(500).json({
      error: errMsg,
    });
  }
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Project 3D server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
