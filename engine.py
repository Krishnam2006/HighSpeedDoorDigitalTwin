# import time
# import sys
# from pymodbus.client import ModbusSerialClient

# # ==========================================================
# # CONFIGURATION
# # ==========================================================

# CONFIG = {
#     "PORT": "COM13",
#     "BAUDRATE": 4800,
#     "BYTESIZE": 8,
#     "PARITY": "N",
#     "STOPBITS": 1,
#     "TIMEOUT": 1,

#     "SLAVE_ID": 1,

#     "OPEN_COIL": 0x0004,
#     "CLOSE_COIL": 0x0005,
#     "STOP_COIL": 0x000A,

#     "ERROR_REGISTER": 0x0084,
#     "STATUS_REGISTER": 0x0085,
# }

# # ==========================================================

# ERROR_CODES = {
#     0: "No Error",
#     1: "Over Current",
#     3: "Under Voltage",
#     4: "Stopped Over Voltage",
#     5: "Runtime Over Voltage",
#     6: "Locked Rotor",
#     7: "Out Of Limit Position",
#     8: "EEPROM Fault",
#     9: "Over Speed",
#     10: "Motor Reversion",
#     11: "Overload",
#     12: "Sample Current Fault",
#     13: "Incremental Encoder Fault",
#     14: "Initial Rotor Angle Fault",
#     15: "Communication Fault",
#     16: "Power On",
#     17: "Power Off",
#     18: "Brake Circuit Fault",
#     19: "Absolute Encoder Fault",
#     20: "Run Time Exceeded",
#     21: "Safety 1 Exceeded",
#     22: "Safety 2 Exceeded",
#     23: "No Limit Settings",
#     24: "24V Fault",
#     26: "Mechanical Limit Fault",
#     27: "Thermal Protect",
#     28: "Electromagnetic Brake Fault",
#     29: "Absolute Encoder Reset",
#     30: "Motor Matching Fault",
#     31: "Incremental Encoder Fault 2",
#     32: "Incremental Encoder Fault 3",
#     33: "Absolute Encoder Fault 2",
#     34: "Absolute Encoder Reset 2",
#     35: "Absolute Encoder Run Reset",
#     36: "Limit Distance Too Short",
#     38: "Electromagnetic Brake Fault 2",
#     39: "Incremental Encoder Fault 4",
#     40: "Incremental Encoder Fault 5",
#     41: "Absolute Encoder Position Unstable",
#     42: "Motor Direction Error",
#     43: "Proximity Switch Too Close",
#     44: "Limit Distance Too Long",
#     45: "Absolute Encoder Direction Fault",
#     46: "Factory Test Not Performed",
#     47: "Limit HALL Value Not Match",
#     48: "Abnormal Door Position",
#     49: "Limit Abnormal",
#     50: "Motor Thermal Protect",
#     51: "Drive Thermal Protect",
#     52: "App Off",
#     53: "Electromagnetic Brake Fault 3",
#     54: "System Matching Fault",
#     55: "IPM Thermal Protect",
#     56: "Out Of Door Track",
# }

# DOOR_STATE = {
#     0: "CLOSED",
#     1: "OPEN",
#     2: "OPENING",
#     3: "CLOSING",
#     4: "STOPPING",
#     5: "STOPPED MIDWAY"
# }


# # ==========================================================


# class DoorController:

#     def __init__(self):

#         self.client = ModbusSerialClient(
#             port=CONFIG["PORT"],
#             baudrate=CONFIG["BAUDRATE"],
#             bytesize=CONFIG["BYTESIZE"],
#             parity=CONFIG["PARITY"],
#             stopbits=CONFIG["STOPBITS"],
#             timeout=CONFIG["TIMEOUT"]
#         )

#     def connect(self):

#         print("\nOpening Serial Port...")

#         if self.client.connect():
#             print("SUCCESS")
#             return True

#         print("FAILED")
#         return False

#     def disconnect(self):

#         self.client.close()

#     def write_coil(self, address, value):

#         print(f"\nWriting Coil 0x{address:04X}")

#         response = self.client.write_coil(
#             address=address,
#             value=value,
#             device_id=CONFIG["SLAVE_ID"]
#         )

#         if response.isError():
#             print("FAILED")
#             print(response)
#             return False

#         print("SUCCESS")
#         return True

#     def read_register(self, address):

#         response = self.client.read_holding_registers(
#             address=address,
#             count=1,
#             device_id=CONFIG["SLAVE_ID"]
#         )

#         if response.isError():
#             print("Read Failed")
#             return None

#         return response.registers[0]

#     def open(self):

#         self.write_coil(CONFIG["OPEN_COIL"], True)

#     def close(self):

#         self.write_coil(CONFIG["CLOSE_COIL"], True)

#     def stop(self):

#         self.write_coil(CONFIG["STOP_COIL"], True)

#     def release_stop(self):

#         self.write_coil(CONFIG["STOP_COIL"], False)

#     def read_error(self):

#         value = self.read_register(CONFIG["ERROR_REGISTER"])

#         if value is None:
#             return

#         print("\nError Code :", value)
#         print("Meaning    :", ERROR_CODES.get(value, "Unknown"))

#     def read_status(self):

#         value = self.read_register(CONFIG["STATUS_REGISTER"])

#         if value is None:
#             return

#         position = value & 0xFF
#         remote_lock = (value >> 8) & 0xFF

#         print("\nDoor State  :", DOOR_STATE.get(position, "Unknown"))
#         print("Remote Lock :", "ENABLED" if remote_lock else "DISABLED")

#     def monitor(self):

#         print("\nPress CTRL+C to stop.\n")

#         try:

#             while True:

#                 self.read_status()
#                 self.read_error()

#                 print("--------------------------------------")

#                 time.sleep(0.1)

#         except KeyboardInterrupt:
#             pass


# # ==========================================================


# def print_config():

#     print("\nCurrent Configuration\n")

#     for k, v in CONFIG.items():
#         print(f"{k:20} : {v}")

#     print()


# def configure():

#     print("\nLeave blank to keep existing value.\n")

#     for key in [
#         "PORT",
#         "BAUDRATE",
#         "SLAVE_ID",
#         "TIMEOUT"
#     ]:

#         value = input(f"{key} [{CONFIG[key]}] : ")

#         if value.strip() == "":
#             continue

#         if key in ("BAUDRATE", "SLAVE_ID", "TIMEOUT"):
#             CONFIG[key] = int(value)
#         else:
#             CONFIG[key] = value


# # ==========================================================


# def menu():

#     print("\n")
#     print("=" * 60)
#     print("POWEVER A4 MODBUS RTU TEST")
#     print("=" * 60)

#     print("1  Connect")
#     print("2  Read Door Status")
#     print("3  Read Error Code")
#     print("4  Open Door")
#     print("5  Close Door")
#     print("6  Stop Door")
#     print("7  Release Stop")
#     print("8  Continuous Monitor")
#     print("9  Show Configuration")
#     print("10 Edit Configuration")
#     print("0  Exit")

#     print("=" * 60)


# # ==========================================================


# def main():

#     controller = DoorController()

#     while True:

#         menu()

#         choice = input("Choice : ").strip()

#         if choice == "1":

#             controller.disconnect()
#             controller = DoorController()
#             controller.connect()

#         elif choice == "2":

#             controller.read_status()

#         elif choice == "3":

#             controller.read_error()

#         elif choice == "4":

#             controller.open()

#         elif choice == "5":

#             controller.close()

#         elif choice == "6":

#             controller.stop()

#         elif choice == "7":

#             controller.release_stop()

#         elif choice == "8":

#             controller.monitor()

#         elif choice == "9":

#             print_config()

#         elif choice == "10":

#             configure()

#         elif choice == "0":

#             controller.disconnect()
#             sys.exit()

#         else:

#             print("Invalid Choice")


# if __name__ == "__main__":
#     main()


from pymodbus.client import ModbusSerialClient
import pandas as pd
from datetime import datetime

# ==========================================================
# CONFIGURATION
# ==========================================================

PORT = "COM13"
BAUDRATE = 4800
SLAVE_ID = 2

START_REGISTER = 0x0000
END_REGISTER = 0x03FF        # Scan first 1024 registers

TIMEOUT = 1

# ==========================================================

client = ModbusSerialClient(
    port=PORT,
    baudrate=BAUDRATE,
    bytesize=8,
    parity="N",
    stopbits=1,
    timeout=TIMEOUT
)

print("="*60)
print("POWEVER REGISTER SCANNER")
print("="*60)

if not client.connect():
    print("Cannot connect.")
    exit()

print("Connected\n")

results = []

for address in range(START_REGISTER, END_REGISTER + 1):

    try:

        response = client.read_holding_registers(
            address=address,
            count=1,
            device_id=SLAVE_ID
        )

        if response.isError():
            print(f"0x{address:04X} -> ERROR")
            continue

        value = response.registers[0]

        print(f"0x{address:04X} -> {value}")

        results.append({
            "Address(Hex)": f"0x{address:04X}",
            "Address(Dec)": address,
            "Value": value
        })

    except Exception as ex:

        print(f"0x{address:04X} -> {ex}")

client.close()

filename = f"register_dump_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

pd.DataFrame(results).to_excel(filename,index=False)

print("\nSaved :", filename)