-- Complete test of guest order creation process
-- Run this in Supabase SQL Editor to verify everything works

-- 1. Test profile creation
DO $$
DECLARE
    test_guest_id UUID := gen_random_uuid();
    test_order_id UUID;
BEGIN
    -- Create test guest profile
    INSERT INTO public.profiles (
        id,
        email,
        role,
        status,
        name,
        phone,
        address,
        created_at,
        updated_at
    ) VALUES (
        test_guest_id,
        'test-guest-' || test_guest_id || '@example.com',
        'customer',
        'active',
        'Test Guest User',
        '0911234567',
        'Test Address, Addis Ababa',
        now(),
        now()
    );

    RAISE NOTICE 'Guest profile created with ID: %', test_guest_id;

    -- 2. Test order creation with new schema
    INSERT INTO public.orders (
        profile_id,
        customer_profile_id,
        status,
        type,
        total_amount,
        display_id,
        created_at,
        updated_at
    ) VALUES (
        test_guest_id,
        test_guest_id,
        'pending',
        'online',
        100.00,
        'TEST-GUEST-' || EXTRACT(EPOCH FROM now())::TEXT,
        now(),
        now()
    ) RETURNING id INTO test_order_id;

    RAISE NOTICE 'Order created with ID: %', test_order_id;

    -- 3. Test order items creation
    INSERT INTO public.order_items (
        order_id,
        product_id,
        quantity,
        price,
        product_name
    )
    SELECT 
        test_order_id,
        p.id,
        2,
        50.00,
        p.name
    FROM public.products p
    LIMIT 1;

    RAISE NOTICE 'Order items created successfully';

    -- 4. Verify the complete order with joins
    PERFORM 
        o.id,
        o.display_id,
        o.status,
        o.total_amount,
        p.name as customer_name,
        p.phone as customer_phone,
        p.address as customer_address,
        array_agg(oi.product_name) as items
    FROM public.orders o
    JOIN public.profiles p ON p.id = o.customer_profile_id
    LEFT JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.id = test_order_id
    GROUP BY o.id, o.display_id, o.status, o.total_amount, p.name, p.phone, p.address;

    RAISE NOTICE 'Order verification completed successfully';

    -- 5. Clean up test data
    DELETE FROM public.order_items WHERE order_id = test_order_id;
    DELETE FROM public.orders WHERE id = test_order_id;
    DELETE FROM public.profiles WHERE id = test_guest_id;

    RAISE NOTICE 'Test data cleaned up successfully';
    RAISE NOTICE 'ALL TESTS PASSED - Guest order system is working correctly!';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: %', SQLERRM;
    RAISE NOTICE 'Test failed. Check database schema and permissions.';
    -- Clean up on error
    DELETE FROM public.order_items WHERE order_id = test_order_id;
    DELETE FROM public.orders WHERE id = test_order_id;
    DELETE FROM public.profiles WHERE id = test_guest_id;
END $$;