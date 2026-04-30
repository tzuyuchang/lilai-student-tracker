<?php
/*
Plugin Name: Lilai Student Tracker
Description: 學生進度追蹤系統核心與安全 API 端點
Version: 1.0
*/

// 阻止直接訪問檔案 (基礎資安)
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// 註冊一個我們專屬的安全 API 端點
add_action( 'rest_api_init', function () {
    register_rest_route( 'lilai/v1', '/submit-order', array(
        'methods' => 'POST',
        'callback' => 'lilai_secure_form_submission',
        // 允許任何人(未登入)發送 POST 請求到這個特定網址
        'permission_callback' => '__return_true', 
    ) );
} );

// 處理接收到的資料
function lilai_secure_form_submission( WP_REST_Request $request ) {
    // 1. 取得前端傳來的參數 (已經過 WordPress 基礎過濾)
    $student_name = sanitize_text_field( $request->get_param( 'studentName' ) );
    $school_id = intval( $request->get_param( 'schoolId' ) );
    
    // 2. 嚴格的安全檢查 (Validation)
    if ( empty( $student_name ) || empty( $school_id ) ) {
        return new WP_Error( 'missing_data', '缺少必要資料', array( 'status' => 400 ) );
    }

    // 3. 在安全的伺服器內部建立文章 (不需要暴露任何密碼給前端)
    $post_data = array(
        'post_title'    => $student_name . ' 的報名方案',
        'post_type'     => 'student_plan',
        'post_status'   => 'draft', // 資安考量：預設為草稿，需由顧問在後台審核才算正式成立
        'post_author'   => 1, // 指定一個管理員 ID 作為擁有者
    );

    // 寫入資料庫
    $post_id = wp_insert_post( $post_data );

    if ( is_wp_error( $post_id ) ) {
        return new WP_Error( 'db_error', '無法建立訂單', array( 'status' => 500 ) );
    }

    // 4. 更新 ACF 欄位 (請確保這裡的 key 跟你在 ACF 設定的一致)
    // 注意：更新 ACF 欄位時，建議使用 ACF 專屬的 update_field 函數
    if ( function_exists('update_field') ) {
        update_field( 'plan_type', '短期語校', $post_id );
        update_field( 'current_stage', 1, $post_id );
        update_field( 'selected_school', $school_id, $post_id );
    }

    // 5. 回傳成功訊息給前端
    return rest_ensure_response( array(
        'success' => true,
        'message' => '報名成功！',
        'order_id' => $post_id
    ) );
}


// 1. 告訴 ACF：當我在後台儲存欄位時，請存成 JSON 放到我的外掛資料夾裡
add_filter('acf/settings/save_json', 'lilai_acf_json_save_point');
function lilai_acf_json_save_point( $path ) {
    return plugin_dir_path( __FILE__ ) . 'acf-json';
}

// 2. 告訴 ACF：載入欄位時，請優先讀取我外掛資料夾裡的 JSON
add_filter('acf/settings/load_json', 'lilai_acf_json_load_point');
function lilai_acf_json_load_point( $paths ) {
    unset($paths[0]); // 移除預設的 Theme 資料夾路徑
    $paths[] = plugin_dir_path( __FILE__ ) . 'acf-json';
    return $paths;
}