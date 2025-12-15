"""
Measurement Module

Receives the decoded Bell-pair circuit from decode.py, measures both qubits,
and returns the resulting two classical bits along with measurement counts.
"""

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator


def measure_decoded(decoded_circuit: QuantumCircuit, shots: int = 1) -> tuple:
	"""
	Measure both qubits of the decoded circuit to retrieve the two classical bits.

	Args:
		decoded_circuit: QuantumCircuit that has been decoded (CNOT + H applied)
		shots: Number of shots for simulation. Default 1 (ideal, deterministic)

	Returns:
		tuple: (bits_str, counts, circuit) where bits_str is a two-bit string
	"""
	qc = decoded_circuit.copy()

	# Measure both qubits
	qc.measure_all()

	# Simulate to get classical results
	simulator = AerSimulator()
	job = simulator.run(qc, shots=shots)
	result = job.result()
	counts = result.get_counts(qc)

	# Choose the most frequent outcome (or the only outcome for shots=1)
	# Qiskit returns bitstrings little-endian (qubit 0 is rightmost). Flip to q0q1 for display.
	bits_le = max(counts, key=counts.get)
	bits_be = bits_le[::-1]
	counts_be = {k[::-1]: v for k, v in counts.items()}

	return bits_be, counts_be, qc

# Measurement + result extraction
