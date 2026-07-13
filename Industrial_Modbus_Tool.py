
import time
from pymodbus.client import ModbusSerialClient
from pymodbus.exceptions import ModbusException
CONFIG={"PORT":"COM13","BAUDRATE":4800,"BYTESIZE":8,"PARITY":"N","STOPBITS":1,"TIMEOUT":1,"SLAVE_ID":1}
client=ModbusSerialClient(port=CONFIG["PORT"],baudrate=CONFIG["BAUDRATE"],bytesize=CONFIG["BYTESIZE"],parity=CONFIG["PARITY"],stopbits=CONFIG["STOPBITS"],timeout=CONFIG["TIMEOUT"])
def decode(resp):
    if not resp.isError(): return
    print(resp)
    try:
        print({1:"Illegal Function",2:"Illegal Data Address",3:"Illegal Data Value",4:"Slave Device Failure",5:"Acknowledge",6:"Slave Busy",8:"Memory Parity Error"}.get(resp.exception_code,"Unknown"))
    except: pass
def connect():
    print("Connected" if client.connect() else "Connection Failed")
def rr():
    a=int(input("Address: ")); c=int(input("Count: "))
    r=client.read_holding_registers(address=a,count=c,device_id=CONFIG["SLAVE_ID"])
    if r.isError(): decode(r); return
    [print(a+i,v) for i,v in enumerate(r.registers)]
def wr():
    a=int(input("Address: ")); v=int(input("Value: "))
    r=client.write_register(address=a,value=v,device_id=CONFIG["SLAVE_ID"])
    print("SUCCESS" if not r.isError() else decode(r))
def rc():
    a=int(input("Address: ")); c=int(input("Count: "))
    r=client.read_coils(address=a,count=c,device_id=CONFIG["SLAVE_ID"])
    if r.isError(): decode(r); return
    [print(a+i,b) for i,b in enumerate(r.bits[:c])]
def wc():
    a=int(input("Coil: ")); v=input("1/0: ")=="1"
    r=client.write_coil(address=a,value=v,device_id=CONFIG["SLAVE_ID"])
    print("SUCCESS" if not r.isError() else decode(r))
def mon():
    try:
        while True:
            for a in [132,133,134,135,136,137,138]:
                r=client.read_holding_registers(address=a,count=1,device_id=CONFIG["SLAVE_ID"])
                if not r.isError(): print(a,r.registers[0])
            print("-"*30); time.sleep(1)
    except KeyboardInterrupt: pass
connect()
while True:
    print("1 RR\\n2 WR\\n3 RC\\n4 WC\\n5 OPEN\\n6 CLOSE\\n7 STOP ON\\n8 STOP OFF\\n9 Monitor\\n0 Exit")
    c=input("> ")
    if c=="1": rr()
    elif c=="2": wr()
    elif c=="3": rc()
    elif c=="4": wc()
    elif c=="5": client.write_coil(address=5,value=True,device_id=CONFIG["SLAVE_ID"])
    elif c=="6": client.write_coil(address=4,value=True,device_id=CONFIG["SLAVE_ID"])
    elif c=="7": client.write_coil(address=11,value=True,device_id=CONFIG["SLAVE_ID"])
    elif c=="8": client.write_coil(address=11,value=False,device_id=CONFIG["SLAVE_ID"])
    elif c=="9": mon()
    elif c=="0": client.close(); break
