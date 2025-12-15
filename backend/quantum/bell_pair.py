from qiskit import QuantumCircuit
import numpy as np

# Public constant to describe default qubit layout for the Bell pair
BELL_PAIR_QUBITS = (0, 1)


def create_bell_pair(random_state: bool = True) -> tuple:
    """
    Create a Bell pair (entangled state) manually using H and CNOT.

    If random_state=True, randomly select one of the four Bell states
    and apply the corresponding single-qubit gates to prepare it.

    Returns:
        tuple: (circuit, state_name) - The circuit and the name of the Bell state
    """
    qc = QuantumCircuit(2, name="Bell Pair")

    state_index = np.random.randint(0, 4) if random_state else 0
    state_names = ["|Φ+⟩", "|Φ-⟩", "|Ψ+⟩", "|Ψ-⟩"]
    state_name = state_names[state_index]

    a, b = BELL_PAIR_QUBITS

    # Base entanglement: H(a) then CNOT(a -> b)
    qc.h(a)
    qc.cx(a, b)

    # Adjust to desired Bell state via single-qubit gates on a
    if state_index == 1:      # |Φ-⟩
        qc.z(a)
    elif state_index == 2:    # |Ψ+⟩
        qc.x(a)
    elif state_index == 3:    # |Ψ-⟩
        qc.x(a)
        qc.z(a)

    qc.barrier()

    return qc, state_name
