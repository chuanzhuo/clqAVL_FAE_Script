
/**
 * @projectDescription Availink: Server side relating to Customer
 * 	Primary working for permission checking for 'AVL Support Person'
 * @author COLOQI Limited
 * @since  2010.2
 * @version Created 201107141726 Zeng, Chuan Zhuo
 */
 
/*
 * 'AVL Support Person' customer permission checking
 */
function clqAVLfae_customer_BeforeLoadSS(type, form)
{
	var context = nlapiGetContext();
	//just trigger and block on user interface operation.
	if ((type.toLowerCase() == 'view' || 'edit' || 'xedit') && context.getExecutionContext() == 'userinterface')
	{
		//nlapiGetUser() return null in custom role: AVL Support Person, 
		var curUser = context.getUser();	//nlapiGetUser();
		//var curRole = nlapiGetRole();	//solution: role internalId need to mapping to role name in configuration file.
		var curRoleName = context.getRoleId();
		var restrictRoleId = nlapiGetContext().getSetting('SCRIPT', 'custscript_clqfae_cust_restrictroleid');
		var restrictRoleIdArr = Boolean(restrictRoleId) ? restrictRoleId.split(',') : null;
		//Setting want to restrict roles and current role is include restrict list.
		if (Boolean(restrictRoleIdArr) && restrictRoleIdArr.indexOf(curRoleName) != -1)
		{
			var permissionMsg = '[CLQ] Permission Violation: this customer, prospect or lead cannot be accessed by your group.';
			var faeOwnerGroupIdArr = nlapiGetFieldValues('custentity_clqfae_customerownergroups');
			if (Boolean(faeOwnerGroupIdArr))
			{
//				var faeOwnerIds = nlapiLookupField('customrecord_clqfae_group', faeOwnerGroupId, 'custrecord_clqfaegroup_employees');
				//need to summary muti-select 'custrecord_clqfaegroup_employees' field.
				var searchRes = nlapiSearchRecord('customrecord_clqfae_group', null, 
											[new nlobjSearchFilter('internalid', null, 'anyof', faeOwnerGroupIdArr)], 
										  	[new nlobjSearchColumn('custrecord_clqfaegroup_employees'), 
										  	 new nlobjSearchColumn('custrecord_clqfaegroup_ownersname')
										  	 ]);
				//nobody contains in this FAE Owner Group 
				if (!Boolean(searchRes))
					throw permissionMsg;
				var curUserIncluded = false;
				for (var i = 0; i < searchRes.length; i++)
				{
					var tempEmployeesArr = searchRes[i].getValue('custrecord_clqfaegroup_employees');
					if (tempEmployeesArr.indexOf(curUser.toString()) != -1)
					{
						curUserIncluded = true;
						break;
					}
				}
				if (curUserIncluded == false)
					throw permissionMsg;
			}else	//lock the unassigned situation.
			{
				throw permissionMsg;
			}
		}
	}
	return true;
}

