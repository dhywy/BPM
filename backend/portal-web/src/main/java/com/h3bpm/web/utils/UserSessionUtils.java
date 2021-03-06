package com.h3bpm.web.utils;

import com.h3bpm.web.vo.UserSessionInfo;

/**
 *
 * Description: 用ThreadLocal提供一个存储线程内变量的地方.
 * <p/>
 * 客户端代码可以用静态方法存储和获取线程内变量,不需要依赖于HttpSession. web层的Controller可通过此处向business层传入user_id之类的变量
 *
 */
@SuppressWarnings("unchecked")
public class UserSessionUtils {
	/** * 保存变量的ThreadLocal，保持在同一线程中同步数据. */
	private static final ThreadLocal<UserSessionInfo> SESSION_MAP = new ThreadLocal<UserSessionInfo>();

	/** * 工具类的protected构造方法. */
	protected UserSessionUtils() {
	}

	/**
	 * 获得线程中保存的属性.
	 *
	 * @param attribute
	 *            属性名称
	 * @return 属性值
	 */
	// public static Object get(String attribute) {
	// Map map = (Map) SESSION_MAP.get();
	// if(map!=null && map.containsKey(attribute)){
	// return map.get(attribute);
	// }
	// return null;
	// }

	public static UserSessionInfo get(String attribute) {
		return SESSION_MAP.get();
	}

	/**
	 * 获得线程中保存的属性，使用指定类型进行转型.
	 *
	 * @param attribute
	 *            属性名称
	 * @param clazz
	 *            类型
	 * @param <T>
	 *            自动转型
	 * @return 属性值
	 */
	public static <T> T get(String attribute, Class<T> clazz) {
		return (T) get(attribute);
	}

	/**
	 * 设置制定属性名的值.
	 *
	 * @param attribute
	 *            属性名称
	 * @param value
	 *            属性值
	 */
	// public static void set(String attribute, Object value) {
	// Map map = (Map) SESSION_MAP.get();
	//
	// if (map == null) {
	// map = new HashMap();
	// SESSION_MAP.set(map);
	// }
	//
	// map.put(attribute, value);
	// }

	public static void set(String attribute, UserSessionInfo value) {
		SESSION_MAP.set(value);
	}

	public static void remove() {
		SESSION_MAP.remove();
	}
}
