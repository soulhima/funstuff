.global _main

.align 4
_main:
    adrp x0, number@PAGE    
    add x0, x0, number@PAGEOFF
    ldrb w0, [x0] 
    mov x1, #1 // accumulator

factorial:
    mul x1, x1, x0 
    sub x0, x0, #1
    cbz x0, end_factorial
    b factorial

end_factorial:
    mov x0, x1
    mov x1, #10 
    mov x4, #0 //length counter 

.align 4
int_to_str:
    udiv x2, x0, x1
    msub x3, x2, x1, x0
    mov x0, x2
    add x3, x3, #48
    lsl x5, x5, #8
    orr x5, x5, x3 
    add x4, x4, #1 //increment string length 
    cbz x2, print_prep
    b int_to_str

print_prep:
    str x5, [sp, #-16]!
    sub sp, sp, #1

.align 4
print:
    add sp, sp, #1
    mov x0, #1
    mov x1, sp
    mov x2, #1
    mov x16, #4
    svc #0
    sub x4, x4, #1
    cbnz x4, print

exit:
    mov x0, #0
    mov x16, #1
    svc #0

.data 
number: .byte 9