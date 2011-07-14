
/**
 * @projectDescription Availink: Server side relating to Case
 * 	Primary working for permission checking for 'AVL Support Person'
 * @author COLOQI Limited
 * @since  2010.2
 * @version Created 201107141540 Zeng, Chuan Zhuo
 */
 
/*
 * 'AVL Support Person' case permission checking
 */
function clqAVLfae_case_BeforeLoadSS(type, form)
{
	var context = nlapiGetContext();
	//just trigger and block on user interface operation.
	if ((type.toLowerCase() == 'view' || 'edit' || 'xedit') && context.getExecutionContext() == 'userinterface')
	{
		//nlapiGetUser() return null in custom role: AVL Support Person, 
		var curUser = context.getUser();	//nlapiGetUser();
		//var curRole = nlapiGetRole();	//solution: role internalId need to mapping to role name in configuration file.
		var curRoleName = context.getRoleId();
		var restrictRoleId = nlapiGetContext().getSetting('SCRIPT', 'custscript_clqfae_case_restrictroleid');
		var restrictRoleIdArr = Boolean(restrictRoleId) ? restrictRoleId.split(',') : null;
		//Setting want to restrict roles and current role is include restrict list.
		if (Boolean(restrictRoleIdArr) && restrictRoleIdArr.indexOf(curRoleName) != -1)
		{
			var permissionMsg = '[CLQ] Permission Violation: this case record does not belong to your group.'
			var faeOwnerGroupId = nlapiGetFieldValue('custevent_clqfae_ownergroup');
			if (Boolean(faeOwnerGroupId))
			{
				var faeOwnerIds = nlapiLookupField('customrecord_clqfae_group', faeOwnerGroupId, 'custrecord_clqfaegroup_employees');
				//nobody contains in this FAE Owner Group
				if (!Boolean(faeOwnerIds))
					throw permissionMsg;
				var faeOwnerIds_Arr = faeOwnerIds.split(',');
				//current user doesn't contain in FAE Owner Group, be careful on the string compare
				if (faeOwnerIds_Arr.indexOf(curUser.toString()) == -1)
					throw permissionMsg;
			}else	//lock the unassigned situation.
			{
				throw permissionMsg;
			}
		}
	}
	return true;
}

