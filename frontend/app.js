const initBtn = document.getElementById('initBtn');
const initContainer = document.getElementById('initContainer');
const timeline = document.getElementById('timeline');
const bellPairContainer = document.getElementById('bellPairContainer');
const animationContainer = document.getElementById('animationContainer');
const createBellBtn = document.getElementById('createBellBtn');
const encodePromptContainer = document.getElementById('encodePromptContainer');
const encodePromptBtn = document.getElementById('encodePromptBtn');
const formContainer = document.getElementById('formContainer');
const encodeContainer = document.getElementById('encodeContainer');
const gatesContainer = document.getElementById('gatesContainer');
const gatesDisplay = document.getElementById('gatesDisplay');
const form = document.getElementById('form');
const bellStatus = document.getElementById('bellStatus');
const bellInfo = document.getElementById('bellInfo');
const bellState = document.getElementById('bellState');
const stateVector = document.getElementById('stateVector');
const encodeStatus = document.getElementById('encodeStatus');
// Right panel: Process status
const processStatus = document.getElementById('processStatus');
const encodeInfo = document.getElementById('encodeInfo');
const encodedBits = document.getElementById('encodedBits');
const gateUsed = document.getElementById('gateUsed');
const encodeStatusRow = document.getElementById('encodeStatusRow');
const encodedGates = document.getElementById('encodedGates');
const sendPromptContainer = document.getElementById('sendPromptContainer');
const sendToBobBtn = document.getElementById('sendToBobBtn');
const sendAnimationContainer = document.getElementById('sendAnimationContainer');
const decodePromptContainer = document.getElementById('decodePromptContainer');
const decodePromptBtn = document.getElementById('decodePromptBtn');
const decodeGatesContainer = document.getElementById('decodeGatesContainer');
const measurePromptContainer = document.getElementById('measurePromptContainer');
const measurePromptBtn = document.getElementById('measurePromptBtn');
const measureResultsContainer = document.getElementById('measureResultsContainer');
const measuredBits = document.getElementById('measuredBits');
const decodedDirac = document.getElementById('decodedDirac');
const measureQ0 = document.getElementById('measureQ0');
const measureQ1 = document.getElementById('measureQ1');
const measurementCounts = document.getElementById('measurementCounts');
const results = document.getElementById('results');
const inBits = document.getElementById('inBits');
const outBits = document.getElementById('outBits');
const counts = document.getElementById('counts');
const randomState = document.getElementById('randomState');
const useRandomState = () => (randomState ? randomState.checked : false);

// Protocol Info: Decode & Measure
const decodeStatus = document.getElementById('decodeStatus');
const decodeInfo = document.getElementById('decodeInfo');
const measureStatus = document.getElementById('measureStatus');
const measureInfo = document.getElementById('measureInfo');
const measureResultBits = document.getElementById('measureResultBits');
// Right panel: Backend connectivity
const backendStatus = document.getElementById('backendStatus');

let selectedBits = '00';

// Initialize button handler
initBtn.addEventListener('click', () => {
  initContainer.style.display = 'none';
  if (processStatus) {
    processStatus.textContent = 'initialized';
    processStatus.classList.remove('pending');
    processStatus.classList.remove('waiting');
    processStatus.classList.add('created');
  }
  bellPairContainer.style.display = 'flex';
  timeline.style.display = 'flex';
});

// Create Bell Pair button handler
createBellBtn.addEventListener('click', () => {
  bellPairContainer.style.display = 'none';
  animationContainer.style.display = 'flex';
  
  // Show encode prompt after animation completes (2 seconds)
  setTimeout(() => {
    animationContainer.style.display = 'none';
    encodePromptContainer.style.display = 'flex';
    
    // Update bell pair status
    bellStatus.textContent = 'created';
    bellStatus.classList.remove('pending');
    bellStatus.classList.add('created');
    bellInfo.style.display = 'block';
    
    // Call backend to get bell pair info
    fetch('http://localhost:8000/bell-info', { method: 'GET' })
      .then(res => res.json())
      .then(data => {
        bellState.textContent = data.state_name || '|Φ+⟩';
        stateVector.textContent = data.state_vector || '(|00⟩ + |11⟩)/√2';
      })
      .catch(err => {
        bellState.textContent = 'Bell Pair';
        stateVector.textContent = '(|00⟩ + |11⟩)/√2';
      });
  }, 2000);
});

// Encode prompt button handler
encodePromptBtn.addEventListener('click', () => {
  encodePromptContainer.style.display = 'none';
  encodeContainer.style.display = 'flex';
  encodeStatusRow.style.display = 'flex';
});

// Gate mapping for encoding
const gateMap = {
  '00': { gates: ['I'], description: 'Identity - no operation' },
  '01': { gates: ['X'], description: 'Pauli-X - bit flip' },
  '10': { gates: ['Z'], description: 'Pauli-Z - phase flip' },
  '11': { gates: ['X', 'Z'], description: 'X then Z - bit and phase flip' }
};

// Encode button handlers
document.querySelectorAll('.encode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const bits = btn.dataset.bits;
    selectedBits = bits;  // Track the encoded bits for later measurement
    encodeContainer.style.display = 'none';
    
    const gateInfo = gateMap[bits];
    
    // Update encode status in Protocol Info
    encodeStatus.textContent = 'encoded';
    encodeStatus.classList.remove('pending');
    encodeStatus.classList.add('created');
    encodeInfo.style.display = 'block';
    encodedBits.textContent = bits;
    encodedGates.textContent = gateInfo.gates.join(' → ');
    
    // Update timeline to Encode Bits
    updateTimelineStep(1);
    
    // Show Bloch sphere visualization with Send to Bob button
    const blochContainer = document.getElementById('blochContainer');
    blochContainer.style.display = 'block';
    // Render Bloch sphere based on actual Bloch vector
    renderBlochSphere(bits);
    // Fetch and display encoded state vector text
    renderEncodedState(bits);
  });
});

// Render Bloch sphere by fetching Bloch vector from backend and positioning the state dot
function renderBlochSphere(bits) {
  const container = document.getElementById('blochSvgContainer');
  fetch('http://localhost:8000/bloch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bits, random_state: useRandomState() })
  })
    .then(res => res.json())
    .then(data => {
      const { x = 0, z = 0 } = (data && data.bloch) ? data.bloch : { x: 0, z: 0 };
      return fetch('/bloch.svg').then(r => r.text()).then(svgText => ({ svgText, x, z }));
    })
    .then(({ svgText, x, z }) => {
      container.innerHTML = svgText;
      const svg = container.querySelector('svg');
      if (!svg) return;
      // Tag for styling animations
      svg.classList.add('bloch-sphere');
      const dot = svg.querySelector('#state');
      const ring = svg.querySelector('#stateRing');
      if (dot) {
        dot.classList.add('bloch-dot-glow');
      }
      // Add rotation to grid lines for subtle motion
      svg.querySelectorAll('line').forEach(l => l.classList.add('bloch-rotate'));
      const cx = 120, cy = 120, r = 95;
      // Project Bloch vector onto X-Z plane; clamp to sphere
      const px = cx + r * Math.max(-1, Math.min(1, x));
      const py = cy - r * Math.max(-1, Math.min(1, z));
      if (dot) {
        dot.setAttribute('cx', String(px));
        dot.setAttribute('cy', String(py));
      }
      if (ring) {
        ring.setAttribute('cx', String(px));
        ring.setAttribute('cy', String(py));
      }
    })
    .catch(() => {
      // Fallback: inject static sphere without positioning
      fetch('/bloch.svg')
        .then(r => r.text())
        .then(svgText => {
          container.innerHTML = svgText;
        })
        .catch(() => {});
    });
}

function renderEncodedState(bits) {
  const target = document.getElementById('encodedStateVector');
  if (!target) return;
  target.textContent = '…';
  fetch('http://localhost:8000/encoded_state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bits, random_state: useRandomState() })
  })
    .then(res => res.json())
    .then(data => {
      const dirac = (data && data.dirac) ? data.dirac : '';
      target.textContent = dirac || 'unavailable';
    })
    .catch(() => {
      target.textContent = 'unavailable';
    });
}

// Send to Bob button handler
sendToBobBtn.addEventListener('click', () => {
  // Hide the Send to Bob button after click
  if (sendToBobBtn) {
    sendToBobBtn.style.display = 'none';
    sendToBobBtn.disabled = true;
  }
  // Also hide the Bloch sphere immediately
  const blochContainer = document.getElementById('blochContainer');
  if (blochContainer) {
    blochContainer.style.display = 'none';
  }
  sendPromptContainer.style.display = 'none';
  sendAnimationContainer.style.display = 'flex';
  
  // Show decode prompt after animation completes (2 seconds)
  setTimeout(() => {
    sendAnimationContainer.style.display = 'none';
    decodePromptContainer.style.display = 'flex';
  }, 2000);
});

// Decode prompt button handler
decodePromptBtn.addEventListener('click', () => {
  decodePromptContainer.style.display = 'none';
  decodeGatesContainer.style.display = 'flex';
  
  // Update timeline to Decode
  updateTimelineStep(2);

  // Update Protocol Info: Decode in progress/completed
  if (decodeStatus) {
    decodeStatus.textContent = 'decoded';
    decodeStatus.classList.remove('pending');
    decodeStatus.classList.add('created');
  }
  if (decodeInfo) decodeInfo.style.display = 'block';
  
  // After gates animation completes, show circuit then prompt measure
  setTimeout(() => {
    decodeGatesContainer.style.display = 'none';
    renderDecodingCircuit();
    const circuitContainer = document.getElementById('circuitContainer');
    circuitContainer.style.display = 'block';
    // Show measure prompt on the same page alongside the circuit
    measurePromptContainer.style.display = 'flex';
  }, 2000);
});

function renderDecodingCircuit() {
  const container = document.getElementById('circuitSvgContainer');
  // Simple two-qubit circuit: wires for q0 (Alice) and q1 (Bob), with CNOT and H labels
  const svg = `
  <svg class="circuit-svg" width="420" height="140" viewBox="0 0 420 140" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <!-- Wires -->
    <line class="wire" x1="20" y1="50" x2="400" y2="50" />
    <line class="wire" x1="20" y1="100" x2="400" y2="100" />
    <!-- Qubit labels -->
    <text class="circuit-label" x="24" y="40">q0 (Alice)</text>
    <text class="circuit-label" x="24" y="90">q1 (Bob)</text>
    <!-- CNOT: control at q0, target at q1 -->
    <circle cx="160" cy="50" r="6" stroke="#0a84ff" fill="#fff" filter="url(#soft)" />
    <line x1="160" y1="56" x2="160" y2="94" stroke="#0a84ff" stroke-width="2" />
    <circle cx="160" cy="100" r="10" stroke="#0a84ff" fill="rgba(10, 132, 255, 0.12)" />
    <line x1="150" y1="100" x2="170" y2="100" stroke="#0a84ff" stroke-width="2" />
    <line x1="160" y1="90" x2="160" y2="110" stroke="#0a84ff" stroke-width="2" />
    <text class="circuit-label" x="140" y="30">CNOT</text>
    <!-- Hadamard on q0 -->
    <rect class="gate-box" x="260" y="36" width="30" height="28" rx="6" />
    <text x="267" y="55" fill="#0a84ff" font-size="12" font-weight="600">H</text>
  </svg>`;
  container.innerHTML = svg;
}

// Measure prompt button handler
measurePromptBtn.addEventListener('click', async () => {
  // Hide Bloch sphere when measuring
  const blochContainer = document.getElementById('blochContainer');
  if (blochContainer) {
    blochContainer.style.display = 'none';
  }
  const circuitContainer = document.getElementById('circuitContainer');
  if (circuitContainer) {
    circuitContainer.style.display = 'none';
  }
  measurePromptContainer.style.display = 'none';
  measureResultsContainer.style.display = 'block';
  if (decodedDirac) decodedDirac.textContent = '…';
  if (measureQ0) measureQ0.textContent = '…';
  if (measureQ1) measureQ1.textContent = '…';
  measuredBits.textContent = '…';
  
  // Update timeline to Measure
  updateTimelineStep(3);
  
  try {
    // Show decoded state and per-qubit probabilities before measuring
    try {
      const decodedResp = await fetch('http://localhost:8000/decoded_state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bits: selectedBits, random_state: useRandomState() })
      });
      if (decodedResp.ok) {
        const decodedData = await decodedResp.json();
        if (decodedDirac) decodedDirac.textContent = decodedData.dirac || 'unavailable';
        const probs = (decodedData.qubit_probs) || {};
        const q0 = probs.q0 || {};
        const q1 = probs.q1 || {};
        const fmt = (p0, p1) => `P(0)=${(p0 || 0).toFixed(2)}, P(1)=${(p1 || 0).toFixed(2)}`;
        if (measureQ0) measureQ0.textContent = fmt(q0['0'], q0['1']);
        if (measureQ1) measureQ1.textContent = fmt(q1['0'], q1['1']);
      } else {
        if (decodedDirac) decodedDirac.textContent = 'unavailable';
      }
    } catch (decodedErr) {
      if (decodedDirac) decodedDirac.textContent = 'unavailable';
    }

    const resp = await fetch('http://localhost:8000/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bits: selectedBits, random_state: useRandomState() })
    });
    
    if (!resp.ok) {
      const errText = await resp.text();
      measuredBits.textContent = 'Error: ' + errText;
      return;
    }
    
    const data = await resp.json();
    measuredBits.textContent = data.decoded_bits;
        if (processStatus) {
          processStatus.textContent = 'completed';
          processStatus.classList.remove('pending');
          processStatus.classList.remove('waiting');
          processStatus.classList.add('created');
        }
    // Update Protocol Info: Measure
    if (measureStatus) {
      measureStatus.textContent = 'measured';
      measureStatus.classList.remove('pending');
      measureStatus.classList.add('created');
    }
    if (measureInfo) measureInfo.style.display = 'block';
    if (measureResultBits) measureResultBits.textContent = data.decoded_bits;
  } catch (err) {
    measuredBits.textContent = 'Error: ' + err.message;
    console.error('Measurement error:', err);
  }
});

function updateTimelineStep(stepIndex) {
  const steps = document.querySelectorAll('.timeline-step');
  steps.forEach((step, i) => {
    if (i <= stepIndex) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });
}

document.querySelectorAll('.seg').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedBits = btn.dataset.bits;
    document.querySelectorAll('.seg').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const resp = await fetch('http://localhost:8000/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bits: selectedBits, random_state: useRandomState() })
    });
    
    if (!resp.ok) {
      const errText = await resp.text();
      alert(`Backend error (${resp.status}): ${errText}`);
      return;
    }
    
    const data = await resp.json();
    inBits.textContent = data.input_bits;
    outBits.textContent = data.decoded_bits;
    counts.textContent = JSON.stringify(data.counts);
    results.hidden = false;
  } catch (err) {
    alert('Failed to contact backend: ' + err.message);
    console.error('Full error:', err);
  }
});

// Initialize default selected
document.querySelector(".seg[data-bits='00']").classList.add('active');

// Check backend connectivity periodically
async function checkBackend() {
  if (!backendStatus) return;
  try {
    backendStatus.textContent = 'checking…';
    backendStatus.classList.remove('created');
    backendStatus.classList.add('pending');
    const resp = await fetch('http://localhost:8000/health', { method: 'GET' });
    if (resp.ok) {
      backendStatus.textContent = 'online';
      backendStatus.classList.remove('pending');
      backendStatus.classList.add('created');
    } else {
      backendStatus.textContent = 'offline';
      backendStatus.classList.remove('created');
      backendStatus.classList.add('pending');
    }
  } catch (e) {
    backendStatus.textContent = 'offline';
    backendStatus.classList.remove('created');
    backendStatus.classList.add('pending');
  }
}

checkBackend();
setInterval(checkBackend, 5000);

