.global _main
.p2align 4

_main:
    //print first instruction
    mov x0, #1
    adrp x1, inst1@PAGE
    add x1, x1, inst1@PAGEOFF
    mov x2, #13
    mov x16, #4
    svc #0

    //user input first number
    mov x0, #0
    adrp x1, num1@PAGE
    add x1, x1, num1@PAGEOFF
    mov x2, #8
    mov x16, #3
    svc #0

    //prep
    adrp x0, num1@PAGE
    add x0, x0, num1@PAGEOFF
    adrp x3, conv@PAGE
    add x3, x3, conv@PAGEOFF
    mov w4, #0
    mov w5, #10

    //convert number 1 string to integer
strtoint:
    ldrb w1, [x0], #1
    cmp w1, #10
    beq nextnum
    sub w2, w1, #48
    mul w4, w4, w5
    add w4, w4, w2
    b strtoint

    //second number prep

nextnum:
    str w4, [x3]
    //print instruction two
    mov x0, #1
    adrp x1, inst2@PAGE
    add x1, x1, inst2@PAGEOFF
    mov x2, #13
    mov x16, #4
    svc #0

    //user input second number
    mov x0, #0
    adrp x1, num2@PAGE
    add x1, x1, num2@PAGEOFF
    mov x2, #8
    mov x16, #3
    svc #0

    //prep
    adrp x0, num2@PAGE
    add x0, x0, num2@PAGEOFF
    adrp x3, conv2@PAGE
    add x3, x3, conv2@PAGEOFF
    mov w4, #0
    mov w5, #10

    //convert number 2 string to integer

strtoint2:
    ldrb w1, [x0], #1
    cmp w1, #10
    beq addition
    sub w2, w1, #48
    mul w4, w4, w5
    add w4, w4, w2
    b strtoint2

    // add number one and two integers

addition:
    str w4, [x3]
    adrp x0, conv@PAGE
    add x0, x0, conv@PAGEOFF
    adrp x1, conv2@PAGE
    add x1, x1, conv2@PAGEOFF
    ldr x2, [x0]
    ldr x3, [x1]
    add x4, x2, x3
    adrp x5, result@PAGE
    add x5, x5, result@PAGEOFF
    str x4, [x5]

    mov x6, #10
    adrp x7, mod@PAGE
    add x7, x7, mod@PAGEOFF

    //convert sum from int to string

conversion:
    ldr x8, [x5]
    udiv x9, x8, x6
    msub x10, x9, x6, x8
    str x9, [x5]
    add x10, x10, #48
    strb w10, [x7], #1
    cbz x9, loadstr
    b conversion

    //count length of string
loadstr:
    mov x8, #0
    adrp x1, mod@PAGE  
    add x1, x1, mod@PAGEOFF

countstr:
    ldrb w2, [x1], #1
    cmp w2, #0
    beq printprep
    add x8, x8, #1
    b countstr

    //reverse print

printprep:
    adrp x7, mod@PAGE
    add x7, x7, mod@PAGEOFF
    add x7, x7, x8 

print:
    sub x7, x7, #1
    mov x0, #1
    mov x1, x7
    mov x2, #1
    mov x16, #4
    svc #0
    sub x8, x8, #1
    cbnz x8, print

exit:
    mov x0, #0                  // Return code 0
    mov x16, #1                 // Syscall number for exit
    svc #0                      // Make system call
    
.data
inst1: .ascii "enter num 1:\n"
inst2: .ascii "enter num 2:\n"
num1: .quad 0
num2: .quad 0
conv: .skip 8
conv2: .skip 8
mod: .skip 8
result: .quad 0