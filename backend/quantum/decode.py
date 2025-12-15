from typing import Optional
from qiskit import QuantumCircuit
from .encode import ENCODED_QUBIT_INDEX, OTHER_QUBIT_INDEX
from .bell_pair import BELL_PAIR_QUBITS


def decode_message(encoded_circuit: QuantumCircuit, encoded_qubit: Optional[int] = None, other_qubit: Optional[int] = None) -> QuantumCircuit:
	
	qc = encoded_circuit.copy()

	# Resolve qubit indices from encode.py and bell_pair.py if not provided
	if encoded_qubit is None:
		encoded_qubit = ENCODED_QUBIT_INDEX
	if other_qubit is None:
		# Prefer OTHER_QUBIT_INDEX from encode; fallback to bell pair constant
		other_qubit = OTHER_QUBIT_INDEX if OTHER_QUBIT_INDEX is not None else BELL_PAIR_QUBITS[1]

	# Decode: CNOT(control=encoded_qubit, target=other_qubit), then Hadamard on encoded_qubit
	qc.cx(encoded_qubit, other_qubit)
	qc.h(encoded_qubit)
	qc.barrier()

	# No measurement or simulation here as requested
	return qc

# Bob's decoding logic
