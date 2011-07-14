
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
	if ((type.toLowerCase() == 'view' || 'edit' || 'xedit') && context.getExecutionContext == 'userinterface')
	{
		//check role first before permission checking.
		var curUser = nlapiGetUser();
		//var curRole = nlapiGetRole();	//solution: role internalId need to mapping to role name in configuration file.
		var curRoleName = context.getRoleId();
		if (curRoleName == 'AVL Support Person')
		{
			var faeOwnerGroupId = nlapiGetFieldValue('custevent_clqfae_ownergroup');
			if (Boolean(faeOwnerGroupId))
			{
				var faeOwnerIds = nlapiLookupField('customrecord_clqfae_group', faeOwnerGroupId, 'custrecord_clqfaegroup_employees');
				if (faeOwnerIds.indexOf(curUser) == -1){
					throw '[CLQ] Permission Violation: this case record does not belong to your group.';
				}
			}
		}
	}
	return true;
}

