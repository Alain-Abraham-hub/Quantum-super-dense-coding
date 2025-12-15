from qiskit import QuantumCircuit
from .bell_pair import create_bell_pair

# Public constants to advertise qubit roles
ENCODED_QUBIT_INDEX = 0  # Alice's half
OTHER_QUBIT_INDEX = 1    # Bob's half


def encode_message(bits: str, random_state: bool = True) -> tuple:
    
    if len(bits) != 2:
        raise ValueError(f"Input must be exactly 2 bits, got {len(bits)}")
    
    if not all(bit in '01' for bit in bits):
        raise ValueError(f"Input must contain only 0s and 1s, got '{bits}'")
    
    # Create Bell pair using local bell_pair module
    qc, bell_state_name = create_bell_pair(random_state=random_state)
    
    # Alice's qubit index
    alice_qubit = ENCODED_QUBIT_INDEX
    
    # Apply gate based on the two classical bits
    if bits == "00":
        # Identity - do nothing
        qc.id(alice_qubit)
    elif bits == "01":
        # Apply X gate (Pauli-X)
        qc.x(alice_qubit)
    elif bits == "10":
        # Apply Z gate (Pauli-Z)
        qc.z(alice_qubit)
    elif bits == "11":
        # Apply Y gate (Pauli-Y)
        qc.y(alice_qubit)
    
    qc.barrier()
    
    return qc, bits
