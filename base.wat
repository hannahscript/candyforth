(module
    (import "env" "log" (func $logf32 (param f32)))
    (import "env" "log" (func $logi32 (param i32)))
    (memory $mem 1)
    (global $SI (mut i32) (i32.const -4))
    (global $HS (mut i32) (i32.const 1024))
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

    (func $alloc
        (local $HI i32)
        (set_local $HI (get_global $HS))
        (loop $findspot
            (get_local $HI)
            (i32.load)

            (i32.sub (i32.const 1) (call $popi32)) (br_if $loop1)
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



    (; User code ;)



    (export "mem" (memory $mem))
    (export "main" (func $ufn_main))
)
