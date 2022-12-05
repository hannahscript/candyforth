(module
    (import "env" "memory" (memory 256))
    (import "env" "log" (func $logf32 (param f32)))
    (import "env" "log" (func $logi32 (param i32)))
    (import "env" "logstr" (func $logstr (param i32) (param i32)))
    (data (i32.const 0) "hello")
    (global $SI (mut i32) (i32.const 1))
    (func $pushf32 (param $v f32)
        (set_global $SI
            (i32.add
                (get_global $SI)
                (i32.const 4)
            )
        )
        (f32.store (get_global $SI) (get_local $v))
    )
    (func $popf32 (result f32)
        (f32.load (get_global $SI))
        (set_global $SI
            (i32.sub
                (get_global $SI)
                (i32.const 4)
            )
        )
    )
    (func $pushi32 (param $v i32)
        (set_global $SI
            (i32.add
                (get_global $SI)
                (i32.const 4)
            )
        )
        (i32.store (get_global $SI) (get_local $v))
    )
    (func $popi32 (result i32)
        (i32.load (get_global $SI))
        (set_global $SI
            (i32.sub
                (get_global $SI)
                (i32.const 4)
            )
        )
    )
    
    (func $ifn_dup
        (f32.load (get_global $SI))
        (call $pushf32)
    )
    (func $ifn_pop
        (set_global $SI
            (i32.sub
                (get_global $SI)
                (i32.const 4)
            )
        )
    )
    (func $ifn_swap (local $a f32)(local $b f32)(set_local $a (call $popf32))(set_local $b (call $popf32))(call $pushf32 (get_local $a))(call $pushf32 (get_local $b)))
        
    (; Standard functions ;)    
    
    (func $ifn_add (call $popf32)(call $popf32)(f32.add)(call $pushf32))
(func $ifn_sub (local $L0 f32)(local $L1 f32)(local.set $L0 (call $popf32))(local.set $L1 (call $popf32))(local.get $L1)(local.get $L0)(f32.sub)(call $pushf32))
(func $ifn_mul (call $popf32)(call $popf32)(f32.mul)(call $pushf32))
(func $ifn_div (local $L0 f32)(local $L1 f32)(local.set $L0 (call $popf32))(local.set $L1 (call $popf32))(local.get $L1)(local.get $L0)(f32.div)(call $pushf32))
(func $ifn_abs (call $popf32)(f32.abs)(call $pushf32))
(func $ifn_sqrt (call $popf32)(f32.sqrt)(call $pushf32))
(func $ifn_lt (local $L0 f32)(local $L1 f32)(local.set $L0 (call $popf32))(local.set $L1 (call $popf32))(local.get $L1)(local.get $L0)(f32.lt)(call $pushi32))
(func $ifn_gt (local $L0 f32)(local $L1 f32)(local.set $L0 (call $popf32))(local.set $L1 (call $popf32))(local.get $L1)(local.get $L0)(f32.gt)(call $pushi32))
(func $ifn_eq (call $popf32)(call $popf32)(f32.eq)(call $pushi32))



(func $ifn_logf32 (call $popf32)(call $logf32))
(func $ifn_logi32 (call $popi32)(call $logi32))
(func $ifn_logstr (local $L0 i32)(local $L1 i32)(local.set $L0 (call $popi32))(local.set $L1 (call $popi32))(local.get $L1)(local.get $L0)(call $logstr))
    
    (; User code ;)    
    
    (func $ufn_main (call $pushi32 (i32.const 0))(call $pushi32 (i32.const 5))
(call $ifn_logstr)
(call $pushi32 (i32.const 0))(call $pushi32 (i32.const 5))
(call $ifn_logstr))

    (export "main" (func $ufn_main))
)