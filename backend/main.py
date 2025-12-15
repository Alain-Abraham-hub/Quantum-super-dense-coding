"""
Super-Dense Coding Backend

Provides both a CLI and a FastAPI HTTP API to run:
create Bell pair -> encode bits -> decode -> measure.
"""

import argparse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from quantum.encode import encode_message
from quantum.decode import decode_message
from quantum.measure import measure_decoded
from qiskit.quantum_info import Statevector, DensityMatrix


app = FastAPI(title="Super-Dense Coding API")
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


class EncodeRequest(BaseModel):
	bits: str
	random_state: bool = True


@app.post("/run")
def run_api(req: EncodeRequest):
	qc_enc, bits_in = encode_message(req.bits, random_state=req.random_state)
	qc_dec = decode_message(qc_enc)
	bits_out, counts, _ = measure_decoded(qc_dec, shots=1)
	return {"input_bits": bits_in, "decoded_bits": bits_out, "counts": counts}


@app.post("/bloch")
def bloch_api(req: EncodeRequest):
	"""
	Return Bloch vector (x,y,z) for Alice's qubit right after encoding.
	Uses partial trace over Bob's qubit to get Alice's reduced density matrix.
	"""
	qc_enc, _ = encode_message(req.bits, random_state=req.random_state)
	sv = Statevector.from_instruction(qc_enc)
	rho_full = DensityMatrix(sv)
	# Trace out Bob's qubit (index 1). Result is Alice's 2x2 density matrix
	rho_alice = rho_full.partial_trace([1]).data
	# Bloch components from density matrix
	# rho = [[a, c],[c*, b]] with a+b=1
	a = float(rho_alice[0, 0].real)
	b = float(rho_alice[1, 1].real)
	c = rho_alice[0, 1]
	x = 2.0 * float(c.real)
	y = -2.0 * float(c.imag)
	z = a - b
	return {"bloch": {"x": x, "y": y, "z": z}}


@app.get("/health")
def health_api():
	return {"status": "ok"}


@app.post("/encoded_state")
def encoded_state_api(req: EncodeRequest):
	"""
	Return the full 2-qubit statevector of the encoded circuit.
	Provides amplitudes and a simple Dirac string for readability.
	"""
	qc_enc, _ = encode_message(req.bits, random_state=req.random_state)
	sv = Statevector.from_instruction(qc_enc)
	# amplitudes in computational basis order
	amps = [complex(a) for a in sv.data.tolist()]
	# build a simple string, rounding small values
	labels = ["|00⟩", "|01⟩", "|10⟩", "|11⟩"]
	terms = []
	for coeff, label in zip(amps, labels):
		mag = abs(coeff)
		if mag > 1e-6:
			# format real+imag concisely
			r = round(coeff.real, 4)
			i = round(coeff.imag, 4)
			if i == 0:
				terms.append(f"{r}{label}")
			elif r == 0:
				terms.append(f"{i}i{label}")
			else:
				sign = '+' if i >= 0 else '-'
				terms.append(f"{r}{sign}{abs(i)}i{label}")
	dirac = ' + '.join(terms) if terms else '0'
	return {"amplitudes": [str(a) for a in amps], "dirac": dirac}


@app.post("/decoded_state")
def decoded_state_api(req: EncodeRequest):
	"""
	Return the decoded circuit's statevector and per-qubit probabilities after CNOT+H.
	Note: No measurement is applied here; this is the pure state post-decoding.
	"""
	qc_enc, _ = encode_message(req.bits, random_state=req.random_state)
	qc_dec = decode_message(qc_enc)
	sv = Statevector.from_instruction(qc_dec)
	amps = [complex(a) for a in sv.data.tolist()]
	labels = ["|00⟩", "|01⟩", "|10⟩", "|11⟩"]
	terms = []
	for coeff, label in zip(amps, labels):
		mag = abs(coeff)
		if mag > 1e-6:
			r = round(coeff.real, 4)
			i = round(coeff.imag, 4)
			if i == 0:
				terms.append(f"{r}{label}")
			elif r == 0:
				terms.append(f"{i}i{label}")
			else:
				sign = '+' if i >= 0 else '-'
				terms.append(f"{r}{sign}{abs(i)}i{label}")
	dirac = ' + '.join(terms) if terms else '0'
	# Per-qubit probabilities (marginals)
	probs = sv.probabilities_dict()
	p0 = probs.get('0', 0.0) + probs.get('00', 0.0) + probs.get('01', 0.0)
	p1 = probs.get('1', 0.0) + probs.get('10', 0.0) + probs.get('11', 0.0)
	# For two-qubit explicit, compute per qubit by summing bits
	p_q0_0 = probs.get('00', 0.0) + probs.get('01', 0.0)
	p_q0_1 = probs.get('10', 0.0) + probs.get('11', 0.0)
	p_q1_0 = probs.get('00', 0.0) + probs.get('10', 0.0)
	p_q1_1 = probs.get('01', 0.0) + probs.get('11', 0.0)
	return {
		"amplitudes": [str(a) for a in amps],
		"dirac": dirac,
		"probabilities": probs,
		"qubit_probs": {
			"q0": {"0": p_q0_0, "1": p_q0_1},
			"q1": {"0": p_q1_0, "1": p_q1_1},
		}
	}


def run_cli(bits: str, random_state: bool):
	qc_enc, bits_in = encode_message(bits, random_state=random_state)
	qc_dec = decode_message(qc_enc)
	bits_out, counts, _ = measure_decoded(qc_dec, shots=1)

	print(f"Input bits: {bits_in}")
	print(f"Decoded bits: {bits_out}")
	print(f"Counts: {counts}")


def main():
	parser = argparse.ArgumentParser(description="Super-Dense Coding CLI/API")
	parser.add_argument("bits", nargs="?", type=str, help="Two-bit string: 00, 01, 10, or 11")
	parser.add_argument("--random-state", action="store_true", help="Randomly choose the initial Bell state")
	parser.add_argument("--serve", action="store_true", help="Start FastAPI server")
	parser.add_argument("--port", type=int, default=8000, help="API port")
	args = parser.parse_args()

	if args.serve:
		uvicorn.run(app, host="0.0.0.0", port=args.port, reload=False)
	else:
		if not args.bits:
			raise SystemExit("Provide bits or use --serve to start API")
		run_cli(args.bits, args.random_state)


if __name__ == "__main__":
	main()
