
/**
 * @projectDescription Availink: Server side relating to Project
 * 	Primary working for summary 'FAE Owner Group' to Customer's 'FAE Owner Groups'
 * @author COLOQI Limited
 * @since  2010.2
 * @version Created 20110714 Zeng, Chuan Zhuo
 */
 
/*
 * 'AVL Support Person' project permission checking
 */
function clqAVLfae_project_BeforeLoadSS(type, form)
{
	var context = nlapiGetContext();
	//just trigger and block on user interface operation.
	if ((type.toLowerCase() == 'view' || type.toLowerCase() == 'edit' || type.toLowerCase() == 'xedit') && context.getExecutionContext() == 'userinterface')
	{
		var curUser = context.getUser();	//nlapiGetUser();
		//var curRole = nlapiGetRole();	//one of solution: role internalId need to mapping to role name in configuration file.
		//'AVL Support Person' get internalid of custom role like 'customrole1012'.
		var curRoleName = context.getRoleId();
		var restrictRoleId = nlapiGetContext().getSetting('SCRIPT', 'custscript_clqfae_project_restrictroleid');
		var restrictRoleIdArr = Boolean(restrictRoleId) ? restrictRoleId.split(',') : null;
		//Setting want to restrict roles and current role is include restrict list.
		if (Boolean(restrictRoleIdArr) && restrictRoleIdArr.indexOf(curRoleName) != -1)
		{
			var permissionMsg = '[CLQ] Permission Violation: this customer, prospect or lead cannot be accessed by your group.';
			var faeOwnerGroupId = nlapiGetFieldValue('custentity_clqfae_ownergroup');
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

/*	
 * Search customer's projects to refresh on summary.
 * BeforeSubmit changed to AfterSubmit, do a search to summary.
 * Even trigger when custentity_clqfae_ownergroup has not value in Project Record.
 * Shoud 'Run as Admin' so can do a totally search for summary
 */
function clqAVLfae_project_AfterSubmitSS(type)
{ 
	if (type.toLowerCase() == 'create' || type.toLowerCase() == 'edit' || type.toLowerCase() == 'xedit')
	{
		//xedit can't use nlapiGetFieldValue 201107151543
		if (type.toLowerCase() == 'xedit')
			var customerId = nlapiLoadRecord('job', nlapiGetNewRecord().getFieldValue('id')).getFieldValue('parent');
		else
			var customerId = nlapiGetFieldValue('parent');
		//advance project should not including in this customisation
		if (!Boolean(customerId)) return true;
		//don't worry, prospect can also be including in such code.
		var origCustomerOwnerGroups_Str = nlapiLookupField('customer', customerId, 'custentity_clqfae_customerownergroups');
		
		var searchRes = nlapiSearchRecord('customer', null, 
											[new nlobjSearchFilter('internalid', null, 'anyof', customerId)], 
										  	[new nlobjSearchColumn('companyname'), 
										  	 new nlobjSearchColumn('custentity_clqfae_ownergroup', 'job')
										  	 ]);
		if (!Boolean(searchRes))
		{ 	//no result so values in any project, clean up customer owner groups
			nlapiSubmitField('customer', customerId, 'custentity_clqfae_customerownergroups', '');
			//return true;
		}else
		{
			//collection for totally related owner group
			var groupsArr = [];
			for (var i = 0; i < searchRes.length; i++ )
			{
				var tempGroup = searchRes[i].getValue('custentity_clqfae_ownergroup', 'job');
				//project1 ownergroup has value and value have not been collected.
				if (Boolean(tempGroup) && groupsArr.indexOf(tempGroup) == -1){
					groupsArr.push(tempGroup);
				}
			}
			//submit/refresh customer owner groups field, multi-select is not support by Xedit.
			//nlapiSubmitField('customer', customerId, 'custentity_clqfae_customerownergroups', groupsArr.join(String.fromCharCode(5)));
			var customerRec = nlapiLoadRecord('customer', customerId);
			customerRec.setFieldValues('custentity_clqfae_customerownergroups', groupsArr);
			//ignoreMandatoryFields = true.
			try{
				var id = nlapiSubmitRecord(customerRec, true, true);
			}catch(ex){
				var detailMsg=ex;
				if (ex instanceof nlobjError){
					detailMsg = ex.getDetails();
				}
				throw '[ERR] Fail to sychronize "Project Owner Group" to customer, Error message: ' + detailMsg + '\rPlease try redit project record.';
			}
		}
	}
	return true;
}


