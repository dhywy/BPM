package com.h3bpm.web.mapper.sqlprovider;

import java.util.Map;

public class MyFileSqlProvider {
	public String findMyFileByParentIdAndKeyword(Map<String, Object> para) {
		String parentId = (String) para.get("parentId");
		String keyword = para.get("keyword") == null ? "" : (String) para.get("keyword");
		String userId = (String) para.get("userId");
		
		String searchPath = para.get("searchPath") == null ? "" : (String) para.get("searchPath");

		String parentIdSqlStr = (parentId == null || parentId.isEmpty()) ? " AND parent_id is null" : " AND parent_id='" + parentId + "'";

		/*
		 * 关键字不为空时，模糊搜索所有目录名称和文件名，不再使用parentId查询
		 */
		String keywordSqlStr = "";
		String searchPathSqlStr = "";
		
		if(!searchPath.isEmpty()){
			parentIdSqlStr = "";
			
			//排除本级目录
			searchPathSqlStr += " AND dir <> '" + searchPath + "'";
			
			searchPathSqlStr += " AND dir like '" + searchPath + "%'";
		}
		
		
		if (!keyword.isEmpty()) {
			parentIdSqlStr = "";
			
			keywordSqlStr += " AND name like '%" + keyword + "%'";
		}
		
		String userIdSqlStr = "";
		if(!userId.isEmpty()){
			userIdSqlStr = " AND create_user_id = '" + userId + "'";
		}
		
		String sql =
				"SELECT"+
			"			 id,"+
			"			 name,"+
			"			 type,"+
			"			 parent_id parentId,"+
			"			 dir,"+
			"			 file_size fileSize,"+
			"			 create_user_id createUserId,"+
			"			 create_time createTime,"+
			"			 download_file_id downloadFileId"+
			"			FROM"+
			"				ot_my_file"+
			"				WHERE is_delete=0 "+
						parentIdSqlStr +
						searchPathSqlStr + 
						keywordSqlStr +
						userIdSqlStr +
			"			ORDER BY"+
			"				name";
		return sql;
	}

	public String findDeletedMyFileByUserId(Map<String, Object> para) {
		String userId = (String)para.get("userId");

		String sql =
				"SELECT"+
						"			 id,"+
						"			 name,"+
						"			 type,"+
						"			 parent_id parentId,"+
						"			 dir,"+
						"			 file_size fileSize,"+
						"			 create_user_id createUserId,"+
						"			 create_time createTime,"+
						"			 is_delete isDelete,"+
						"			 delete_time deleteTime"+
						"			FROM"+
						"				ot_my_file"+
						"				WHERE is_delete=1 AND "+
						"           create_user_id = '" + userId + "'"+
						"				ORDER BY delete_time DESC";
		return sql;
	}
	
}